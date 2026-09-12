"""会话管理：基于 Redis 存储多轮对话历史，支持上下文压缩。

设计：
- 每个会话有唯一 session_id（前端传入或自动生成）。
- 历史消息以 JSON 列表存于 Redis，TTL 自动过期。
- 当消息条数超过阈值时，调用模型对早期历史做摘要压缩，避免 Token 爆炸。
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any, Dict, List, Optional

import redis.asyncio as redis

from config import settings
from core.model_router import model_router

logger = logging.getLogger(__name__)

# 触发摘要压缩的消息条数阈值
COMPRESSION_THRESHOLD = 20
# 压缩后保留的最近消息条数
KEEP_RECENT = 6


class SessionManager:
    """多轮会话存储 + 上下文压缩。"""

    def __init__(self) -> None:
        self._redis: Optional[redis.Redis] = None
        self._ttl = settings.session_ttl_seconds

    async def _get_redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(
                settings.redis_url, decode_responses=True
            )
        return self._redis

    @staticmethod
    def _key(session_id: str) -> str:
        return f"ai:session:{session_id}"

    @staticmethod
    def _ctx_key(session_id: str) -> str:
        return f"ai:session:{session_id}:ctx"

    @staticmethod
    def _pending_key(session_id: str) -> str:
        return f"ai:session:{session_id}:pending"

    # ------------------------------------------------------------------
    @staticmethod
    def new_session_id(prefix: str = "sess") -> str:
        return f"{prefix}_{uuid.uuid4().hex[:16]}"

    async def exists(self, session_id: str) -> bool:
        r = await self._get_redis()
        return bool(await r.exists(self._key(session_id)))

    async def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """读取会话的全部消息（含已压缩的摘要）。"""
        r = await self._get_redis()
        raw = await r.get(self._key(session_id))
        if not raw:
            return []
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.error("Corrupt session %s, resetting", session_id)
            return []

    async def append_message(
        self, session_id: str, message: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """追加一条消息，并按需触发上下文压缩。返回压缩后的消息列表。"""
        r = await self._get_redis()
        messages = await self.get_messages(session_id)
        messages.append(message)

        if len(messages) > COMPRESSION_THRESHOLD:
            messages = await self._compress(session_id, messages)

        await r.set(self._key(session_id), json.dumps(messages, ensure_ascii=False),
                    ex=self._ttl)
        return messages

    async def clear(self, session_id: str) -> None:
        r = await self._get_redis()
        await r.delete(self._key(session_id))
        await r.delete(self._ctx_key(session_id))
        await r.delete(self._pending_key(session_id))

    async def set_pending(
        self, session_id: str, pending: Optional[Dict[str, Any]]
    ) -> None:
        """持久化挂起的写操作；传 None 表示清除。"""
        r = await self._get_redis()
        key = self._pending_key(session_id)
        if pending is None:
            await r.delete(key)
        else:
            await r.set(
                key,
                json.dumps(pending, ensure_ascii=False),
                ex=self._ttl,
            )

    async def get_pending(self, session_id: str) -> Optional[Dict[str, Any]]:
        """读取挂起的写操作。"""
        r = await self._get_redis()
        raw = await r.get(self._pending_key(session_id))
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    async def set_context(self, session_id: str, ctx: Dict[str, Any]) -> None:
        """存储会话上下文（如购物车、用户信息等非消息数据）。"""
        r = await self._get_redis()
        await r.set(
            self._ctx_key(session_id),
            json.dumps(ctx, ensure_ascii=False),
            ex=self._ttl,
        )

    async def get_context(self, session_id: str) -> Dict[str, Any]:
        """读取会话上下文。"""
        r = await self._get_redis()
        raw = await r.get(self._ctx_key(session_id))
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}

    # ------------------------------------------------------------------
    async def _compress(
        self, session_id: str, messages: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """把早期消息摘要化，仅保留最近 KEEP_RECENT 条。"""
        try:
            to_summarize = messages[:-KEEP_RECENT]
            keep_recent = messages[-KEEP_RECENT:]

            summary_prompt = [
                {
                    "role": "system",
                    "content": (
                        "请把以下多轮对话浓缩成一段简洁中文摘要，"
                        "保留关键事实、用户意图与已做的决策，"
                        "不要丢失任何具体数据（如商品ID、订单号、价格）。"
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(to_summarize, ensure_ascii=False),
                },
            ]
            resp = await model_router.chat(summary_prompt, temperature=0.3)
            summary_text = resp.choices[0].message.content

            logger.info("Session %s compressed %d msgs -> summary",
                        session_id, len(to_summarize))
            return [
                {"role": "system", "content": f"[历史摘要] {summary_text}"},
                *keep_recent,
            ]
        except Exception:
            logger.exception("Compression failed, keeping full history")
            return messages


# 模块级单例
session_manager = SessionManager()
