"""仪表盘数据工具：供Admin Copilot查询运营数据。

提供Dashboard核心指标查询，帮助Copilot回答运营问题：
- 今日/近期销售额、订单数
- 销量趋势
- 热销商品
- 低库存预警
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def get_dashboard_overview(args: Dict[str, Any]) -> ToolResult:
    """获取Dashboard概览统计数据。读操作。"""
    data = await http_client.get_json("/api/admin/dashboard/overview")
    return ToolResult(
        success=True,
        data=data,
        message="Dashboard概览数据获取成功"
    )


async def get_sales_trend(args: Dict[str, Any]) -> ToolResult:
    """获取销售趋势数据。读操作。"""
    days = args.get("days", 30)
    data = await http_client.get_json("/api/admin/dashboard/sales-trend", {"days": days})
    return ToolResult(
        success=True,
        data=data,
        message=f"获取到最近{days}天销售趋势"
    )


async def get_top_products(args: Dict[str, Any]) -> ToolResult:
    """获取热销商品排行。读操作。"""
    days = args.get("days", 30)
    limit = args.get("limit", 10)
    data = await http_client.get_json("/api/admin/dashboard/top-products", {"days": days, "limit": limit})
    return ToolResult(
        success=True,
        data=data,
        message=f"获取到最近{days}天Top{limit}热销商品"
    )


def register(registry) -> None:
    registry.add(
        name="get_dashboard_overview",
        description=(
            "获取运营Dashboard核心概览数据：今日销售额、7天销售额、30天销售额、"
            "今日订单数、7天订单数、总订单数、商品总数、低库存预警、待处理工单数量。"
            "这是回答运营概况问题最常用的入口。"
        ),
        parameters={
            "type": "object",
            "properties": {},
        },
        executor=get_dashboard_overview,
        require_confirm=False,
    )

    registry.add(
        name="get_sales_trend",
        description="获取最近N天的每日销售趋势：日期、订单数、销售额。用于绘制趋势图或分析销售波动。",
        parameters={
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "查询天数，默认30天，最大90天", "default": 30},
            },
        },
        executor=get_sales_trend,
        require_confirm=False,
    )

    registry.add(
        name="get_top_selling_products",
        description="获取最近N天热销商品排行：商品名称、销量、销售额。用于分析热销品和库存备货。",
        parameters={
            "type": "object",
            "properties": {
                "days": {"type": "integer", "description": "查询天数，默认30天", "default": 30},
                "limit": {"type": "integer", "description": "返回数量，默认10个", "default": 10},
            },
        },
        executor=get_top_products,
        require_confirm=False,
    )
