"""Admin Copilot 路由。

提供端点：
- POST /api/copilot/chat        SSE 流式对话（主入口）
- POST /api/copilot/confirm     对写操作给出确认/拒绝
- GET  /api/copilot/sessions    当前用户会话历史
- GET  /api/copilot/sessions/{session_id}/messages  会话消息
- GET  /api/copilot/operations  当前用户写操作历史

SSE 事件格式（每行 `data: <json>\n\n`）：
  {"type":"tool_call","name":"...","args":{...},"require_confirm":true}
  {"type":"confirm","tool_name":"...","args":{...},"message":"...","confirm_token":"..."}
  {"type":"tool_result","name":"...","result":"...","success":true}
  {"type":"final","content":"..."}
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents import copilot_agent
from config import settings
from core.db import AsyncSessionLocal
from core.session_manager import session_manager
from services import copilot_history
from tools.base import auth_token_context

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


class ChatRequest(BaseModel):
    message: str = Field(..., description="运营输入的自然语言指令")
    session_id: Optional[str] = Field(
        None, description="会话ID，不传则新建"
    )
    enable_tools: bool = Field(True, description="是否启用工具调用")


class ConfirmRequest(BaseModel):
    session_id: str
    confirmed: bool = Field(..., description="true 执行，false 取消")
    confirm_token: str = Field(..., description="confirm 事件中下发的确认令牌")


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


async def verify_admin_token(request: Request) -> Dict[str, Any]:
    """从 Authorization header 提取 Bearer token，并到 Java 后端校验当前用户身份。

    local 模式且未配置 JAVA_API_TOKEN 时，放行模拟管理员账号，便于开发测试。
    """
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="缺少 Authorization header")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization 格式错误，应为 Bearer <token>")
    token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token 为空")

    if settings.is_local and not settings.java_api_token and not token:
        # local 模式无后端 token 兜底时,允许无 header 接入
        return {"userId": "local_admin", "name": "Local Admin", "access": "admin"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.java_api_base_url}/api/currentUser",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()
            user = data.get("data", data) if isinstance(data, dict) else data
            if not user or not user.get("access"):
                raise HTTPException(status_code=401, detail="无法解析用户信息")
            # guest / 空角色不允许使用 Copilot
            if user.get("access") in ("guest", ""):
                raise HTTPException(status_code=403, detail="当前账号无权使用 Copilot")
            # 保存原始 token，供工具层透传给 Java 后端
            user["__admin_token"] = token
            return user
    except httpx.HTTPStatusError as e:
        logger.warning("Admin token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Token 无效或已过期")
    except Exception as e:
        logger.warning("Admin token verification error: %s", e)
        raise HTTPException(status_code=503, detail="无法连接用户认证服务")


@router.post("/chat")
async def chat(req: ChatRequest, current_user: Dict[str, Any] = Depends(verify_admin_token)):
    """流式对话。返回 text/event-stream。"""
    session_id = req.session_id or session_manager.new_session_id("copilot")
    user_id = current_user.get("userId") or current_user.get("id") or "unknown"

    # 持久化：会话元数据 + 用户消息
    async with AsyncSessionLocal() as db:
        try:
            existing = await copilot_history.list_messages(db, session_id, user_id)
            title = copilot_history.generate_title(req.message) if not existing else None
            await copilot_history.ensure_session(
                db, session_id, user_id, title=title or "新对话"
            )
            await copilot_history.save_message(
                db, session_id, role="user", content=req.message
            )
        except Exception:
            logger.exception("Failed to persist chat start")

    token = current_user.get("__admin_token")

    async def event_stream():
        # token context 必须在 generator 内部 set,才能在同一 asyncio Task 里 reset
        # 否则 FastAPI 的 StreamingResponse 会把 generator 调度到新 Task,触发
        # `Token was created in a different Context`
        token_ctx = auth_token_context.set(token) if token else None
        try:
            # 先回送 session_id，便于前端续接
            yield _sse({"type": "session", "session_id": session_id})
            final_content = ""
            try:
                async for event in copilot_agent.run(
                    session_id,
                    req.message,
                    enable_tools=req.enable_tools,
                    operator_info=current_user,
                ):
                    yield _sse(event)
                    if event.get("type") == "final":
                        final_content = event.get("content") or ""
            except Exception as e:
                yield _sse({"type": "error", "message": str(e)})
            finally:
                # 持久化：助手最终回复
                if final_content:
                    async with AsyncSessionLocal() as db:
                        try:
                            await copilot_history.save_message(
                                db, session_id, role="assistant", content=final_content
                            )
                            await copilot_history.ensure_session(db, session_id, user_id)
                        except Exception:
                            logger.exception("Failed to persist final message")
        finally:
            if token_ctx is not None:
                try:
                    auth_token_context.reset(token_ctx)
                except (ValueError, LookupError):
                    # 兜底:不同 Context 时静默忽略
                    pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/confirm")
async def confirm(
    req: ConfirmRequest,
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """对挂起的写操作给出确认结果，继续执行。

    confirm_token 必须来自同一会话最近一次 confirm 事件，防止确认到已被替换的操作。
    """
    # viewer / user 角色只读，不能确认任何写操作
    if current_user.get("access") in ("viewer", "user"):
        raise HTTPException(status_code=403, detail="当前账号为只读角色，无权执行写操作")

    user_id = current_user.get("userId") or current_user.get("id") or "unknown"
    token = current_user.get("__admin_token")
    token_ctx = auth_token_context.set(token) if token else None

    async def event_stream():
        operation_recorded = False
        final_content = ""
        try:
            async for event in copilot_agent.resume_after_confirm(
                req.session_id,
                req.confirmed,
                operator_info=current_user,
                confirm_token=req.confirm_token,
            ):
                yield _sse(event)
                if event.get("type") == "tool_result":
                    # 持久化写操作审计
                    if not operation_recorded:
                        operation_recorded = True
                        async with AsyncSessionLocal() as db:
                            try:
                                await copilot_history.save_operation(
                                    db=db,
                                    session_id=req.session_id,
                                    user_id=user_id,
                                    tool_name=event.get("name", "unknown"),
                                    args=event.get("args") or {},
                                    result=event.get("result"),
                                    success=bool(event.get("success")),
                                )
                            except Exception:
                                logger.exception("Failed to persist operation")
                elif event.get("type") == "final":
                    final_content = event.get("content") or ""
        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})
        finally:
            # 持久化确认后的最终总结
            if final_content:
                async with AsyncSessionLocal() as db:
                    try:
                        await copilot_history.save_message(
                            db, req.session_id, role="assistant", content=final_content
                        )
                        await copilot_history.ensure_session(db, req.session_id, user_id)
                    except Exception:
                        logger.exception("Failed to persist confirm final message")
            if token_ctx is not None:
                auth_token_context.reset(token_ctx)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/sessions")
async def list_sessions(
    current_user: Dict[str, Any] = Depends(verify_admin_token),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """当前用户的 Copilot 会话历史。"""
    user_id = current_user.get("userId") or current_user.get("id") or "unknown"
    async with AsyncSessionLocal() as db:
        sessions = await copilot_history.list_sessions(db, user_id, limit=limit, offset=offset)
    return {"success": True, "data": sessions}


@router.get("/sessions/{session_id}/messages")
async def list_session_messages(
    session_id: str,
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """获取指定会话的消息列表（仅允许查看自己的会话）。"""
    user_id = current_user.get("userId") or current_user.get("id") or "unknown"
    async with AsyncSessionLocal() as db:
        messages = await copilot_history.list_messages(db, session_id, user_id)
    return {"success": True, "data": messages}


@router.get("/operations")
async def list_operations(
    current_user: Dict[str, Any] = Depends(verify_admin_token),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """当前用户的写操作历史。"""
    user_id = current_user.get("userId") or current_user.get("id") or "unknown"
    async with AsyncSessionLocal() as db:
        ops = await copilot_history.list_operations(db, user_id, limit=limit, offset=offset)
    return {"success": True, "data": ops}
