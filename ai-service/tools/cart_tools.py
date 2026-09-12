"""购物车与促销工具：客服 Agent 专属。

query_cart: 从会话上下文中读取顾客当前购物车内容。
query_promotions: 查询当前可用促销活动、折扣、优惠券。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from core.session_manager import session_manager
from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def query_cart(args: Dict[str, Any]) -> ToolResult:
    """查询顾客当前购物车内容。读操作。

    购物车数据由前端通过 cart_context 传入并存入会话，
    本工具从会话上下文中读取并返回。
    """
    session_id = args.get("session_id")
    if not session_id:
        return ToolResult(
            success=False,
            message="缺少 session_id，无法读取购物车",
        )

    try:
        ctx = await session_manager.get_context(session_id)
        cart = ctx.get("cart", [])
    except Exception as e:
        logger.warning("读取购物车上下文失败: %s", e)
        return ToolResult(success=False, message=f"读取购物车失败: {e}")

    if not cart:
        return ToolResult(
            success=True,
            data={"items": [], "count": 0, "total": 0},
            message="购物车为空",
        )

    # 计算总价
    total = sum((item.get("price", 0) or 0) * (item.get("quantity", 1) or 1)
                for item in cart)
    count = sum(item.get("quantity", 1) or 1 for item in cart)

    return ToolResult(
        success=True,
        data={"items": cart, "count": count, "total": round(total, 2)},
        message=f"购物车共 {count} 件商品，合计 ${round(total, 2)}",
    )


async def query_promotions(args: Dict[str, Any]) -> ToolResult:
    """查询当前促销活动与可用折扣。读操作。"""
    data = await http_client.get_json("/api/coupons/promotions")
    return ToolResult(success=True, data=data, message="促销活动查询完成")


async def query_coupon_status(args: Dict[str, Any]) -> ToolResult:
    """查询用户的优惠券状态。读操作。

    返回：
    - 可用优惠券列表（未使用且未过期）
    - 每张券的面值、使用门槛、有效期、适用范围
    - 即将过期（7天内）的优惠券提醒
    - 已使用/已过期的优惠券概要
    """
    user_id = args.get("user_id")
    if not user_id:
        return ToolResult(
            success=False,
            message="缺少 user_id，无法查询优惠券",
        )

    data = await http_client.get_json("/api/coupons", params={"userId": user_id})
    return ToolResult(success=True, data=data, message="优惠券状态查询完成")


def register(registry) -> None:
    registry.add(
        name="query_cart",
        description=(
            "查询顾客当前购物车内容，包括商品名称、单价、数量和小计。"
            "用于回答顾客关于购物车商品、价格计算、凑单、折扣适用等问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "当前会话ID",
                },
            },
            "required": ["session_id"],
        },
        executor=query_cart,
        require_confirm=False,
    )
    registry.add(
        name="query_promotions",
        description=(
            "查询当前可用的促销活动、优惠券和折扣规则。"
            "用于回答顾客关于折扣码、满减活动、免运费条件等问题。"
            "调用时不需要额外参数。"
        ),
        parameters={
            "type": "object",
            "properties": {},
        },
        executor=query_promotions,
        require_confirm=False,
    )
    registry.add(
        name="query_coupon_status",
        description=(
            "查询当前用户的个人优惠券状态，包括可用优惠券列表、"
            "每张券的面值/使用门槛/有效期/适用范围、"
            "即将过期的优惠券提醒（7天内）、已使用和已过期券的统计。"
            "用于回答顾客关于'我有什么优惠券'、'这张券怎么用'、'有没有快过期的券'等问题。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "用户ID（由系统自动注入）",
                },
            },
            "required": ["user_id"],
        },
        executor=query_coupon_status,
        require_confirm=False,
    )
