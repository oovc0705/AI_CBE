"""数据导出工具：导出订单/商品为 CSV。

导出虽然不改业务数据，但会生成文件并占用存储，因此标记为 require_confirm=True。
"""
from __future__ import annotations

import csv
import io
import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def export_orders(args: Dict[str, Any]) -> ToolResult:
    """导出订单数据为 CSV。写操作（生成文件）→ require_confirm=True。"""
    params = {}
    if args.get("status"):
        params["status"] = args["status"]
    if args.get("days"):
        params["days"] = args["days"]
    if args.get("start_date"):
        params["startDate"] = args["start_date"]
    if args.get("end_date"):
        params["endDate"] = args["end_date"]

    data = await http_client.get_json("/api/admin/orders/export", params=params)
    # 预期 Java 后端返回 CSV 文本或订单列表
    csv_text = data if isinstance(data, str) else _orders_to_csv(data)
    return ToolResult(success=True, data={"csv": csv_text},
                      message="订单导出完成")


async def export_products(args: Dict[str, Any]) -> ToolResult:
    """导出商品数据为 CSV。写操作（生成文件）→ require_confirm=True。"""
    params = {}
    if args.get("category"):
        params["category"] = args["category"]
    if args.get("low_stock_threshold") is not None:
        params["lowStock"] = args["low_stock_threshold"]
    if args.get("online") is not None:
        params["online"] = args["online"]

    data = await http_client.get_json("/api/admin/products/export", params=params)
    csv_text = data if isinstance(data, str) else _products_to_csv(data)
    return ToolResult(success=True, data={"csv": csv_text},
                      message="商品导出完成")


def _orders_to_csv(rows: list) -> str:
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def _products_to_csv(rows: list) -> str:
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def register(registry) -> None:
    registry.add(
        name="export_orders",
        description="导出订单数据为 CSV。会生成文件，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "订单状态筛选，可选"},
                "days": {"type": "integer", "description": "最近N天，可选"},
                "start_date": {"type": "string", "description": "开始日期，如 2024-06-01，可选"},
                "end_date": {"type": "string", "description": "结束日期，如 2024-06-30，可选"},
            },
        },
        executor=export_orders,
        require_confirm=True,
    )
    registry.add(
        name="export_products",
        description="导出商品数据为 CSV。会生成文件，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "分类筛选，可选"},
                "low_stock_threshold": {"type": "integer", "description": "库存低于此值的商品，可选"},
                "online": {"type": "boolean", "description": "是否只导出上架/下架商品，可选"},
            },
        },
        executor=export_products,
        require_confirm=True,
    )
