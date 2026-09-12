"""优惠券与促销工具：管理员创建、更新、停用优惠券/促销活动。

客服侧只能查询优惠券状态，管理员 Copilot 可以操作。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def create_coupon(args: Dict[str, Any]) -> ToolResult:
    """创建优惠券。写操作 → require_confirm=True。"""
    payload = {
        "code": args["code"],
        "name": args["name"],
        "type": args["type"],  # percentage / fixed / shipping
        "value": args["value"],
        "minOrder": args.get("min_order"),
        "applicableCategories": args.get("applicable_categories", ["all"]),
        "validFrom": args.get("valid_from"),
        "validUntil": args.get("valid_until"),
        "maxUsage": args.get("max_usage"),
    }
    data = await http_client.post_json("/api/admin/coupons", payload)
    return ToolResult(success=True, data=data,
                      message=f"优惠券 {args['code']} 创建成功")


async def update_coupon(args: Dict[str, Any]) -> ToolResult:
    """更新优惠券。写操作 → require_confirm=True。"""
    coupon_id = args["coupon_id"]
    payload = {k: v for k, v in {
        "name": args.get("name"),
        "value": args.get("value"),
        "minOrder": args.get("min_order"),
        "validUntil": args.get("valid_until"),
        "status": args.get("status"),
    }.items() if v is not None}
    data = await http_client.put_json(f"/api/admin/coupons/{coupon_id}", payload)
    return ToolResult(success=True, data=data,
                      message=f"优惠券 {coupon_id} 更新成功")


async def toggle_promotion(args: Dict[str, Any]) -> ToolResult:
    """启用/停用优惠券/促销活动。写操作 → require_confirm=True。"""
    promotion_id = args["promotion_id"]
    active = args["active"]
    action = "启用" if active else "停用"
    # 平台目前将促销与优惠券统一管理，通过 toggle 接口切换 ACTIVE/INACTIVE
    data = await http_client.post_json(
        f"/api/admin/coupons/{promotion_id}/toggle",
        {"active": active},
    )
    return ToolResult(success=True, data=data,
                      message=f"优惠券/促销 {promotion_id} 已{action}")


def register(registry) -> None:
    registry.add(
        name="create_coupon",
        description="创建新的优惠券。写操作，会影响顾客的优惠规则，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "优惠券码，如 SUMMER15"},
                "name": {"type": "string", "description": "优惠券名称"},
                "type": {"type": "string",
                         "description": "类型：percentage（百分比折扣）/ fixed（固定金额）/ shipping（免运费）"},
                "value": {"type": "number", "description": "优惠值，如 15 或 20"},
                "min_order": {"type": "number", "description": "最低订单金额，可选"},
                "applicable_categories": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "适用分类，默认 [all]",
                },
                "valid_from": {"type": "string", "description": "生效日期，如 2025-01-01，可选"},
                "valid_until": {"type": "string", "description": "失效日期，如 2025-12-31，可选"},
                "max_usage": {"type": "integer", "description": "最大使用次数，可选"},
            },
            "required": ["code", "name", "type", "value"],
        },
        executor=create_coupon,
        require_confirm=True,
    )
    registry.add(
        name="update_coupon",
        description="更新已有优惠券。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "coupon_id": {"type": "string", "description": "优惠券ID"},
                "name": {"type": "string", "description": "新名称，可选"},
                "value": {"type": "number", "description": "新优惠值，可选"},
                "min_order": {"type": "number", "description": "新最低订单金额，可选"},
                "valid_until": {"type": "string", "description": "新失效日期，可选"},
                "status": {"type": "string", "description": "状态：active/inactive，可选"},
            },
            "required": ["coupon_id"],
        },
        executor=update_coupon,
        require_confirm=True,
    )
    registry.add(
        name="toggle_promotion",
        description="启用或停用促销活动。写操作，执行前需人工确认。",
        parameters={
            "type": "object",
            "properties": {
                "promotion_id": {"type": "string", "description": "促销活动ID"},
                "active": {"type": "boolean", "description": "true 启用，false 停用"},
            },
            "required": ["promotion_id", "active"],
        },
        executor=toggle_promotion,
        require_confirm=True,
    )
