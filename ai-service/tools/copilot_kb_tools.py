"""Copilot 专属知识库检索工具。

用于检索管理员操作手册、平台政策、数据库表结构说明等，
让 Copilot 在回答运营规范类问题或生成 SQL 时有据可依。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from config import settings
from core.rag_engine import rag_engine
from .base import ToolResult, tool_registry

logger = logging.getLogger(__name__)


async def search_copilot_kb(args: Dict[str, Any]) -> ToolResult:
    """从 Copilot 知识库检索管理员文档、操作手册、SQL 表结构等。只读。"""
    query = (args.get("query") or "").strip()
    if not query:
        return ToolResult(success=False, message="检索关键词不能为空")

    top_k = int(args.get("top_k", 4))
    collection = args.get("collection") or settings.chroma_collection_copilot

    try:
        hits = await rag_engine.search(collection, query, top_k=top_k)
    except Exception as e:
        logger.exception("Copilot KB search failed")
        return ToolResult(
            success=False,
            message=f"知识库检索失败: {e}",
        )

    if not hits:
        return ToolResult(
            success=True,
            data={"hits": [], "count": 0},
            message="知识库中未检索到相关文档，请基于通用运营常识谨慎回答。",
        )

    items = [
        {
            "content": h["content"],
            "metadata": h.get("metadata", {}),
            "score": round(h.get("score", 0.0), 4),
        }
        for h in hits
    ]
    return ToolResult(
        success=True,
        data={"hits": items, "count": len(items)},
        message=f"已检索到 {len(items)} 条相关文档，请在回答中严格依据这些内容。",
    )


def register(registry) -> None:
    registry.add(
        name="search_copilot_kb",
        description=(
            "检索 Copilot 管理员知识库，包括运营手册、平台政策、数据库表结构说明、"
            "SQL 示例等。用于回答运营规范问题或辅助生成准确的 SQL 查询。"
            "调用时传入问题关键词或完整问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "检索关键词或问题，例如『订单表结构』『退款流程』",
                },
                "top_k": {
                    "type": "integer",
                    "description": "返回的最多文档数，默认 4",
                    "default": 4,
                },
            },
            "required": ["query"],
        },
        executor=search_copilot_kb,
        require_confirm=False,
    )
