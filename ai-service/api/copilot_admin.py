"""Admin Copilot 历史管理路由。

提供端点（前缀 /copilot，通过 /ai-service/ 代理访问）：
- GET  /copilot/sessions
- GET  /copilot/sessions/{session_id}/messages
- GET  /copilot/operations
- DELETE /copilot/sessions/{session_id}

响应格式与 Java 后端一致：{code: 200, message: "ok", data: ..., success: true}
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from core.db import AsyncSessionLocal
from services import copilot_history
from tools.base import auth_token_context
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["copilot-admin"])


def _ok(data: Any = None, message: str = "ok") -> Dict[str, Any]:
    return {"code": 200, "message": message, "data": data, "success": True}


def _fail(message: str, code: int = 400) -> Dict[str, Any]:
    return {"code": code, "message": message, "data": None, "success": False}


def _paginate(total: int, page: int, size: int, content: list) -> Dict[str, Any]:
    return {
        "content": content,
        "totalElements": total,
        "totalPages": (total + size - 1) // size,
        "number": page - 1,
        "size": size,
        "first": page == 1,
        "last": page * size >= total,
    }


async def verify_admin_token(request: Request) -> Dict[str, Any]:
    """从 Authorization header 提取 Bearer token，并校验管理员身份。"""
    auth = request.headers.get("Authorization")
    if not auth:
        raise HTTPException(status_code=401, detail="缺少 Authorization header")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization 格式错误，应为 Bearer <token>")
    token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token 为空")

    if settings.is_local and not settings.java_api_token:
        return {"userId": "local_admin", "name": "Local Admin", "access": "admin", "__admin_token": token}

    import httpx
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
            if user.get("access") in ("guest", "", "user"):
                raise HTTPException(status_code=403, detail="当前账号无权访问 Copilot 管理")
            user["__admin_token"] = token
            return user
    except httpx.HTTPStatusError as e:
        logger.warning("Admin token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Token 无效或已过期")
    except Exception as e:
        logger.warning("Admin token verification error: %s", e)
        raise HTTPException(status_code=503, detail="无法连接用户认证服务")


@router.get("/sessions")
async def list_copilot_sessions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """管理员：列出所有 Copilot 会话。"""
    token = current_user.get("__admin_token")
    token_ctx = auth_token_context.set(token) if token else None
    try:
        async with AsyncSessionLocal() as db:
            total = await copilot_history.count_all_sessions(db)
            sessions = await copilot_history.list_all_sessions(db, limit=size, offset=(page - 1) * size)
        return _ok(_paginate(total, page, size, sessions))
    finally:
        if token_ctx is not None:
            try:
                auth_token_context.reset(token_ctx)
            except (ValueError, LookupError):
                pass


@router.get("/sessions/{session_id}/messages")
async def list_copilot_messages(
    session_id: str,
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """管理员：查看指定会话的消息。"""
    token = current_user.get("__admin_token")
    token_ctx = auth_token_context.set(token) if token else None
    try:
        async with AsyncSessionLocal() as db:
            messages = await copilot_history.list_all_messages(db, session_id)
        return _ok(messages)
    finally:
        if token_ctx is not None:
            try:
                auth_token_context.reset(token_ctx)
            except (ValueError, LookupError):
                pass


@router.get("/operations")
async def list_copilot_operations(
    session_id: str = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """管理员：列出所有 Copilot 写操作记录。"""
    token = current_user.get("__admin_token")
    token_ctx = auth_token_context.set(token) if token else None
    try:
        async with AsyncSessionLocal() as db:
            total = await copilot_history.count_all_operations(db, session_id=session_id)
            ops = await copilot_history.list_all_operations(
                db, session_id=session_id, limit=size, offset=(page - 1) * size
            )
        return _ok(_paginate(total, page, size, ops))
    finally:
        if token_ctx is not None:
            auth_token_context.reset


@router.delete("/sessions/{session_id}")
async def delete_copilot_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(verify_admin_token),
):
    """管理员：删除指定会话及其消息、操作记录。"""
    token = current_user.get("__admin_token")
    token_ctx = auth_token_context.set(token) if token else None
    try:
        async with AsyncSessionLocal() as db:
            deleted = await copilot_history.delete_session(db, session_id)
        if not deleted:
            return _fail("会话不存在", 404)
        return _ok(None, "删除成功")
    finally:
        if token_ctx is not None:
            try:
                auth_token_context.reset(token_ctx)
            except (ValueError, LookupError):
                pass
