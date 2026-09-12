"""Storefront 智能客服路由（阶段二）。

端点：
- POST /api/customer/chat   SSE 流式对话

权限说明：
- user_id 必填，但**仅在无 token 的访客场景下作为标识使用**；
- 请求带 `Authorization: Bearer <token>` 时，token 会透传给工具层，
  Java 后端按 token 身份强制过滤订单，自报的 user_id 不再被信任；
- 未认证请求在后端拿不到任何归属他人的订单（订单列表对未认证请求返回空）。
- 彻底根治仍需 C 端服务端账户体系（当前 storefront 账户是 localStorage 模拟）。
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agents import customer_agent
from core.session_manager import session_manager
from tools.base import auth_token_context

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/customer", tags=["customer"])


class ChatRequest(BaseModel):
    message: str = Field(..., description="顾客输入")
    session_id: Optional[str] = Field(None, description="会话ID，不传则新建")
    user_id: str = Field(
        ..., description="C端用户ID（生产由 JWT 注入，必填，用于订单权限隔离）"
    )
    cart_context: Optional[list] = Field(
        None, description="前端购物车内容，作为上下文供 AI 查询"
    )
    browsing_history: Optional[list] = Field(
        None, description="用户浏览历史（最近10个商品），用于个性化推荐"
    )
    user_context: Optional[dict] = Field(
        None, description="用户上下文信息（会员等级、语言偏好等）"
    )


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest, request: Request):
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id 必填（订单权限隔离）")

    session_id = req.session_id or session_manager.new_session_id("cust")

    # 带 Bearer token 时透传给工具层：Java 端按 token 身份强制过滤订单，
    # 客户端自报的 user_id 不再被信任；访客（无 token）后端不会返回他人订单
    auth_header = request.headers.get("Authorization") or ""
    token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else None

    # 将前端上下文信息存入会话，供各工具读取
    context = {}
    if req.cart_context:
        context["cart"] = req.cart_context
    if req.browsing_history:
        context["browsing_history"] = req.browsing_history
    if req.user_context:
        context["user_context"] = req.user_context

    if context:
        await session_manager.set_context(session_id, context)

    async def event_stream():
        # token context 必须在 generator 内部 set，才能在同一 asyncio Task 里 reset
        token_ctx = auth_token_context.set(token) if token else None
        try:
            yield _sse({"type": "session", "session_id": session_id,
                        "user_id": req.user_id})
            try:
                async for event in customer_agent.run(
                    session_id,
                    req.message,
                    enable_tools=True,
                    caller_user_id=req.user_id,
                ):
                    yield _sse(event)
            except Exception as e:
                yield _sse({"type": "error", "message": str(e)})
        finally:
            if token_ctx is not None:
                try:
                    auth_token_context.reset(token_ctx)
                except (ValueError, LookupError):
                    logger.debug("auth token context reset skipped (different context)")

    return StreamingResponse(event_stream(), media_type="text/event-stream")
