"""数据分析工具：自然语言转 SQL（NL2SQL）的数据查询。

这是 Admin Copilot 的核心能力之一：运营用自然语言提问（"上周哪些品类销量跌了"），
LLM 把它转成 SQL，由 Java 后端的安全执行接口返回结果，再由 LLM 总结成自然语言。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)

# 允许的 SQL 类型白名单，由 Java 后端二次校验
_SAFE_SQL_PREFIXES = ("SELECT", "WITH")


async def query_business_data(args: Dict[str, Any]) -> ToolResult:
    """执行 SQL 查询业务数据（只读）。读操作。"""
    sql = (args.get("sql") or "").strip()
    if not sql:
        return ToolResult(success=False, message="SQL 不能为空")
    upper = sql.upper().lstrip("(")
    if not upper.startswith(_SAFE_SQL_PREFIXES):
        return ToolResult(
            success=False,
            message="只允许只读查询（SELECT / WITH），禁止改写数据",
        )
    data = await http_client.post_json(
        "/api/admin/query",
        {"sql": sql},
    )
    return ToolResult(success=True, data=data,
                      message=f"查询返回 {len(data) if isinstance(data, list) else '?'} 行")


def register(registry) -> None:
    registry.add(
        name="query_business_data",
        description=(
            "用 SQL 查询电商业务数据（订单、商品、销量、库存等）。"
            "只允许 SELECT/WITH 只读查询。用于回答运营的数据类问题，"
            "如『上周各品类销量』『最近30天退货率最高的商品』。"
            "调用时把自然语言问题先转成标准 SQL 再传入。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "sql": {"type": "string",
                        "description": "标准 SQL 查询语句，只读",
                        },
            },
            "required": ["sql"],
        },
        executor=query_business_data,
        require_confirm=False,
    )
