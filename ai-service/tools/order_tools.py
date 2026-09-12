"""订单工具：查询订单、处理退款、物流跟踪。"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def query_orders(args: Dict[str, Any]) -> ToolResult:
    """查询订单。读操作。

    权限隔离：若调用方传入 user_id（客服 Agent 从 caller_user_id 注入），
    必须带上过滤，确保顾客只能查到自己的订单。Java 后端会再次校验。
    """
    params = {}
    # caller_user_id 由编排器在客服场景注入；缺失表示管理员视角（无过滤）
    user_id = args.get("user_id")
    if user_id:
        params["userId"] = user_id
    if args.get("order_id"):
        params["orderId"] = args["order_id"]
    if args.get("status"):
        params["status"] = args["status"]
    if args.get("days"):
        params["days"] = args["days"]

    # ✅ 增强日志：详细记录查询参数
    logger.info(
        "[订单查询] 开始查询 - "
        f"user_id={user_id or '未提供(管理员视角)'}, "
        f"order_id={args.get('order_id')}, "
        f"status={args.get('status')}, "
        f"days={args.get('days')}"
    )

    data = await http_client.get_json("/api/orders", params=params)

    # ✅ 增强日志：记录查询结果
    order_count = len(data) if isinstance(data, list) else 1
    logger.info(
        f"[订单查询成功] 找到 {order_count} 条订单, "
        f"user_id={user_id or '管理员'}"
    )

    return ToolResult(success=True, data=data, message="订单查询完成")


async def query_order_shipping(args: Dict[str, Any]) -> ToolResult:
    """查询订单的详细物流跟踪信息。读操作。

    返回：
    - 物流服务商（DHL/FedEx/UPS/顺丰等）
    - 运单号
    - 当前状态（已揽收/运输中/派送中/已签收）
    - 物流轨迹（时间线）
    - 预计送达时间
    """
    order_id = args.get("order_id")
    if not order_id:
        return ToolResult(
            success=False,
            message="缺少 order_id，无法查询物流信息",
        )

    data = await http_client.get_json(f"/api/orders/{order_id}/shipping")
    return ToolResult(success=True, data=data, message=f"订单 {order_id} 物流信息查询完成")


async def update_order_status(args: Dict[str, Any]) -> ToolResult:
    """更新订单状态。写操作 → require_confirm=True。

    支持状态：pending/paid/shipped/delivered/cancelled/refunded
    """
    order_id = args["order_id"]
    status = args["status"]
    note = args.get("note", "")
    return ToolResult(success=True, data=data,
                      message=f"订单 {order_id} 状态已更新为 {status}")


async def ship_order(args: Dict[str, Any]) -> ToolResult:
    """订单发货。写操作 → require_confirm=True。"""
    order_id = args["order_id"]
    carrier = args.get("carrier", "")
    tracking_number = args.get("tracking_number", "")
    # ⚠️ 写操作走 admin API
    data = await http_client.post_json(
        f"/api/admin/orders/{order_id}/ship",
        {"carrier": carrier, "trackingNumber": tracking_number},
    )
    return ToolResult(success=True, data=data,
                      message=f"订单 {order_id} 已发货")


async def process_refund(args: Dict[str, Any]) -> ToolResult:
    """处理退款。写操作 + 高风险 → require_confirm=True。"""
    order_id = args["order_id"]
    amount = args.get("amount")
    reason = args.get("reason", "")
    # ⚠️ 写操作走 admin API
    data = await http_client.post_json(
        f"/api/admin/orders/{order_id}/refund",
        {"amount": amount, "reason": reason},
    )
    return ToolResult(success=True, data=data,
                      message=f"订单 {order_id} 退款已处理")


def register(registry) -> None:
    registry.add(
        name="query_orders",
        description="查询订单，支持按订单号、状态、近N天筛选。",
        parameters={
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单号，精确查询"},
                "status": {"type": "string",
                           "description": "状态：pending/paid/shipped/delivered/refunded"},
                "days": {"type": "integer", "description": "最近N天的订单"},
            },
        },
        executor=query_orders,
        require_confirm=False,
    )
    registry.add(
        name="query_order_shipping",
        description=(
            "查询指定订单的详细物流跟踪信息，包括物流服务商、运单号、"
            "当前状态（已揽收/运输中/派送中/已签收）、物流轨迹时间线和预计送达时间。"
            "用于回答顾客关于包裹位置、配送进度等问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "要查询的订单号"},
            },
            "required": ["order_id"],
        },
        executor=query_order_shipping,
        require_confirm=False,
    )
    registry.add(
        name="update_order_status",
        description="更新订单状态，如标记已付款、已发货、已完成、已取消等。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单号"},
                "status": {"type": "string",
                           "description": "目标状态：pending/paid/shipped/delivered/cancelled/refunded"},
                "note": {"type": "string", "description": "备注，可选"},
            },
            "required": ["order_id", "status"],
        },
        executor=update_order_status,
        require_confirm=True,
    )
    registry.add(
        name="ship_order",
        description="对订单执行发货操作，填写物流承运商和运单号。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单号"},
                "carrier": {"type": "string", "description": "物流承运商，如 DHL/FedEx/UPS"},
                "tracking_number": {"type": "string", "description": "运单号"},
            },
            "required": ["order_id"],
        },
        executor=ship_order,
        require_confirm=True,
    )
    registry.add(
        name="process_refund",
        description="处理订单退款。这是高风险写操作，会真实发生资金变动，执行前必须人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "订单号"},
                "amount": {"type": "number", "description": "退款金额，不填为全额"},
                "reason": {"type": "string", "description": "退款原因"},
            },
            "required": ["order_id"],
        },
        executor=process_refund,
        require_confirm=True,
    )
