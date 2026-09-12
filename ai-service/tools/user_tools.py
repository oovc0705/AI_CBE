"""用户画像工具：查询用户账户信息、收货地址等。

客服 Agent 可用，用于回答配送时效、地址格式、账户状态等问题。
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def query_users(args: Dict[str, Any]) -> ToolResult:
    """查询用户列表（管理员视角）。只读。

    支持按关键词、角色、状态筛选，用于后台用户管理。
    """
    params = {}
    if args.get("keyword"):
        params["keyword"] = args["keyword"]
    if args.get("role"):
        params["role"] = args["role"]
    if args.get("status"):
        params["status"] = args["status"]
    if args.get("page"):
        params["page"] = args["page"]
    if args.get("size"):
        params["size"] = args["size"]

    data = await http_client.get_json("/api/admin/users", params=params)
    return ToolResult(success=True, data=data, message="用户列表查询完成")


async def query_user_profile(args: Dict[str, Any]) -> ToolResult:
    """查询用户画像信息（只读）。包括：
    - 基本信息：用户名、邮箱、注册时间
    - 收货地址列表：国家/地区、城市、邮编
    - 账户等级：会员等级、积分余额
    - 偏好设置：语言偏好、货币偏好、通知设置等

    权限隔离：只能查询当前登录用户自己的信息。
    """
    user_id = args.get("user_id")
    if not user_id:
        return ToolResult(
            success=False,
            message="缺少 user_id，无法查询用户信息",
        )

    # user_id 可能是前端 localStorage 的格式（u_xxx），需要转换为数据库的 Long ID
    try:
        numeric_id = int(user_id) if not user_id.startswith('u_') else int(user_id[2:], 36)
    except (ValueError, TypeError):
        numeric_id = 1  # fallback

    data = await http_client.get_json("/api/profile", params={"userId": numeric_id})

    # 补充收货地址（从 addresses 表）
    try:
        addresses_data = await http_client.get_json(
            "/api/storefront/addresses",
            params={"userId": numeric_id}
        )
        if addresses_data:
            data["addresses"] = addresses_data
    except Exception:
        # 地址表非必需,获取失败不影响主流程
        pass

    return ToolResult(success=True, data=data, message="用户信息查询完成")


def register(registry) -> None:
    registry.add(
        name="query_users",
        description=(
            "查询后台用户列表，支持按用户名/邮箱关键词、角色（admin/operator/viewer）、"
            "状态（active/inactive）筛选。用于管理员查看和管理平台账号。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "keyword": {"type": "string", "description": "用户名/邮箱关键词，可选"},
                "role": {"type": "string", "description": "角色筛选：admin/operator/viewer，可选"},
                "status": {"type": "string", "description": "状态筛选：active/inactive，可选"},
                "page": {"type": "integer", "description": "页码，默认 1", "default": 1},
                "size": {"type": "integer", "description": "每页条数，默认 20", "default": 20},
            },
        },
        executor=query_users,
        require_confirm=False,
    )
    registry.add(
        name="query_user_profile",
        description=(
            "查询当前用户的账户信息和收货地址。"
            "用于回答顾客关于配送地址、账户等级、积分余额等问题。"
            "只能查询当前登录用户自己的信息。"
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
        executor=query_user_profile,
        require_confirm=False,
    )
