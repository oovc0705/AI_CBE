"""配送选项工具：查询可用的配送方式、时效和费用。

客服 Agent 可用，用于回答顾客关于配送选择、时效预估、运费计算等问题。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def query_shipping_options(args: Dict[str, Any]) -> ToolResult:
    """查询可用的配送选项。读操作。

    参数：
    - destination_country: 目的地国家（可选，用于计算国际运费）
    - order_total: 订单金额（可选，用于判断免运费资格）

    返回：
    - 配送方式列表（标准/加急/经济）
    - 每种方式的费用
    - 预计配送时间
    - 免运费门槛
    """
    params = {}
    if args.get("destination_country"):
        params["country"] = args["destination_country"]
    if args.get("order_total") is not None:
        params["orderTotal"] = args.get("order_total")

    data = await http_client.get_json("/api/shipping/options", params=params)
    return ToolResult(success=True, data=data, message="配送选项查询完成")


def register(registry) -> None:
    registry.add(
        name="query_shipping_options",
        description=(
            "查询可用的配送方式选项，包括每种方式的费用、预计送达时间、承运商信息。"
            "可以传入目的地国家和订单金额以获取精确的运费报价和免运费资格判断。"
            "用于回答顾客关于配送选择、运费、时效等问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "destination_country": {
                    "type": "string",
                    "description": "目的地国家代码（如 US, CN, UK），可选",
                },
                "order_total": {
                    "type": "number",
                    "description": "订单总金额，用于判断免运费资格，可选",
                },
            },
        },
        executor=query_shipping_options,
        require_confirm=False,
    )
