"""FAQ / 政策知识检索工具：客服 Agent 专属。

通过 RAGEngine 检索 customer_kb 集合（FAQ、退货政策、物流时效、支付说明等），
返回相关条款让模型基于真实政策回答，避免编造。

读操作，无需人工确认。客服 Agent 唯一的非订单查询类工具。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from config import settings
from core.rag_engine import rag_engine
from .base import ToolResult, tool_registry

logger = logging.getLogger(__name__)


async def search_faq(args: Dict[str, Any]) -> ToolResult:
    """从客服知识库检索 FAQ / 政策条款。读操作。"""
    query = (args.get("query") or "").strip()
    if not query:
        return ToolResult(success=False, message="检索关键词不能为空")

    top_k = int(args.get("top_k", 4))
    collection = args.get("collection") or settings.chroma_collection_customer

    try:
        hits = await rag_engine.search(collection, query, top_k=top_k)
    except Exception as e:
        logger.exception("FAQ search failed")
        return ToolResult(
            success=False,
            message=f"知识库检索失败: {e}",
        )

    if not hits:
        # 没命中也告诉模型，避免它再次瞎猜
        return ToolResult(
            success=True,
            data={"hits": [], "count": 0},
            message="知识库中未检索到相关条款，请基于通用电商常识谨慎回答，"
                    "并建议顾客联系人工客服获取准确信息。",
        )

    # 整理成模型友好的结构
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
        message=f"已检索到 {len(items)} 条相关条款，请在回答中严格依据这些内容。",
    )


def register(registry) -> None:
    registry.add(
        name="search_faq",
        description=(
            "从客服知识库检索 FAQ、退货/退款政策、物流时效、支付说明等条款。"
            "用于回答顾客关于售后、物流、关税、尺码、保修等政策类问题。"
            "调用时传入顾客问题的核心关键词或完整问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "顾客问题或检索关键词，例如『退货流程』『发往日本的运费』",
                },
                "top_k": {
                    "type": "integer",
                    "description": "返回的最多条款数，默认 4",
                    "default": 4,
                },
            },
            "required": ["query"],
        },
        executor=search_faq,
        require_confirm=False,
    )
