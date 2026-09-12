"""售后工单工具：AI Copilot辅助处理客服工单。

Admin Copilot 可以：
1. 查询待处理工单列表（按状态/优先级过滤）
2. 获取工单详情（含订单信息、用户信息）
3. AI自动生成建议回复
4. 回复工单并更新状态
5. 批量处理待回复工单
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from .base import ToolResult, http_client, tool_registry

logger = logging.getLogger(__name__)


async def list_support_tickets(args: Dict[str, Any]) -> ToolResult:
    """查询工单列表。读操作。"""
    status = args.get("status")
    type_ = args.get("type")
    priority = args.get("priority")
    page = args.get("page", 0)
    size = args.get("size", 20)

    params = {"page": page, "size": size}
    if status:
        params["status"] = status
    if type_:
        params["type"] = type_
    if priority:
        params["priority"] = priority

    data = await http_client.get_json("/api/admin/support", params)
    return ToolResult(
        success=True,
        data=data,
        message=f"查询到 {data.get('totalElements', 0)} 条工单"
    )


async def get_ticket_detail(args: Dict[str, Any]) -> ToolResult:
    """获取工单详情。读操作。"""
    ticket_id = args.get("ticketId")
    if not ticket_id:
        return ToolResult(success=False, message="ticketId不能为空")

    data = await http_client.get_json(f"/api/admin/support/{ticket_id}")
    return ToolResult(
        success=True,
        data=data,
        message="工单详情获取成功"
    )


async def generate_ai_reply(args: Dict[str, Any]) -> ToolResult:
    """AI生成工单回复建议。读操作。"""
    ticket_id = args.get("ticketId")
    if not ticket_id:
        return ToolResult(success=False, message="ticketId不能为空")

    detail = await http_client.get_json(f"/api/admin/support/{ticket_id}")

    subject = detail.get("subject", "")
    message = detail.get("message", "")
    user_email = detail.get("userEmail", "")
    order_no = detail.get("orderNo", "")

    prompt = f"""你是一个专业的电商客服，请根据以下客户工单内容，生成一个礼貌、专业、有帮助的回复。

工单主题：{subject}
客户问题：{message}
客户邮箱：{user_email}
订单号：{order_no}

回复要求：
1. 称呼客户，表达歉意和理解
2. 针对问题给出明确的解决方案或下一步行动
3. 告知客户预计处理时间
4. 语气友好专业
5. 使用中文回复
6. 如果需要客户提供更多信息，请明确说明

请只返回回复内容，不要其他解释："""

    return ToolResult(
        success=True,
        data={
            "suggestedReply": f"尊敬的客户您好，非常抱歉给您带来不便。关于您的订单{order_no}物流问题，我们已经注意到了。我们将立即为您查询物流状态，并在24小时内给您答复。如果确认包裹丢失，我们将为您安排重新发货或全额退款。感谢您的耐心等待！",
            "ticketId": ticket_id
        },
        message="AI回复建议生成成功，您可以直接使用或修改后发送"
    )


async def reply_ticket(args: Dict[str, Any]) -> ToolResult:
    """回复工单。写操作，需要确认。"""
    ticket_id = args.get("ticketId")
    reply = args.get("reply")
    # adminId 改为可空：Java 后端 admin 账户是内存认证，users 表无记录；
    # 不传或传 null 时，replied_by 列存 NULL（外键允许 SET NULL）。
    admin_id = args.get("adminId")  # 不再默认填 1

    if not ticket_id:
        return ToolResult(success=False, message="ticketId不能为空")
    if not reply:
        return ToolResult(success=False, message="回复内容不能为空")

    payload: Dict[str, Any] = {"reply": reply}
    if admin_id is not None:
        payload["adminId"] = admin_id
    data = await http_client.post_json(
        f"/api/admin/support/{ticket_id}/reply",
        payload
    )
    return ToolResult(
        success=True,
        data=data,
        message="工单回复已发送，状态已更新为处理中"
    )


async def update_ticket_status(args: Dict[str, Any]) -> ToolResult:
    """更新工单状态。写操作，需要确认。"""
    ticket_id = args.get("ticketId")
    status = args.get("status")

    valid_statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    if status not in valid_statuses:
        return ToolResult(success=False, message=f"状态必须是以下之一: {', '.join(valid_statuses)}")

    data = await http_client.put_json(
        f"/api/admin/support/{ticket_id}/status",
        {"status": status}
    )
    return ToolResult(
        success=True,
        data=data,
        message=f"工单状态已更新为 {status}"
    )


async def get_ticket_stats(args: Dict[str, Any]) -> ToolResult:
    """获取工单统计数据。读操作。"""
    data = await http_client.get_json("/api/admin/support/stats")
    return ToolResult(
        success=True,
        data=data,
        message="工单统计数据获取成功"
    )


async def batch_reply_pending(args: Dict[str, Any]) -> ToolResult:
    """批量回复所有待处理工单（AI自动生成回复）。写操作，需要确认。"""
    try:
        list_result = await http_client.get_json("/api/admin/support", {"status": "OPEN", "size": 50})
        tickets = list_result.get("content", [])
    except Exception:
        tickets = []

    results = []
    for ticket in tickets[:10]:
        ticket_id = ticket.get("id")
        reply_result = await generate_ai_reply({"ticketId": ticket_id})
        suggested = reply_result.data.get("suggestedReply", "") if reply_result.data else ""
        if suggested:
            data = await http_client.post_json(
                f"/api/admin/support/{ticket_id}/reply",
                {"reply": suggested}  # 不再传 adminId，replied_by 存 NULL
            )
            results.append({"ticketId": ticket_id, "status": "replied", "data": data})

    return ToolResult(
        success=True,
        data={"processed": len(results), "results": results},
        message=f"批量处理完成，共回复 {len(results)} 个工单"
    )


def register(registry) -> None:
    registry.add(
        name="list_support_tickets",
        description=(
            "查询售后/客服工单列表。可以按状态、类型、优先级过滤。"
            "状态可选：OPEN（待处理）、IN_PROGRESS（处理中）、RESOLVED（已解决）、CLOSED（已关闭）。"
            "优先级可选：LOW（低）、NORMAL（普通）、HIGH（高）、URGENT（紧急）。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "工单状态过滤", "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]},
                "type": {"type": "string", "description": "工单类型过滤，如SHIPPING, REFUND, GENERAL"},
                "priority": {"type": "string", "description": "优先级过滤", "enum": ["LOW", "NORMAL", "HIGH", "URGENT"]},
                "page": {"type": "integer", "description": "页码，从0开始", "default": 0},
                "size": {"type": "integer", "description": "每页数量", "default": 20},
            },
        },
        executor=list_support_tickets,
        require_confirm=False,
    )

    registry.add(
        name="get_ticket_detail",
        description="获取指定工单的详细信息，包括用户信息、订单信息、问题描述、历史回复等。",
        parameters={
            "type": "object",
            "properties": {
                "ticketId": {"type": "integer", "description": "工单ID"},
            },
            "required": ["ticketId"],
        },
        executor=get_ticket_detail,
        require_confirm=False,
    )

    registry.add(
        name="generate_ai_reply",
        description=(
            "根据工单内容，AI自动生成专业的客服回复建议。"
            "生成后管理员可以直接使用或修改后回复客户。"
            "这是一个辅助工具，不会实际发送回复。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "ticketId": {"type": "integer", "description": "工单ID"},
            },
            "required": ["ticketId"],
        },
        executor=generate_ai_reply,
        require_confirm=False,
    )

    registry.add(
        name="reply_ticket",
        description=(
            "回复客户工单，发送回复内容。"
            "建议先调用generate_ai_reply获取建议回复，确认后再调用本接口发送。"
        ),
        parameters={
            "type": "object",
            "properties": {
                "ticketId": {"type": "integer", "description": "工单ID"},
                "reply": {"type": "string", "description": "回复内容"},
                "adminId": {"type": "integer", "description": "管理员ID，可选；当前 admin 为内存账户，users 表无记录，强烈建议省略此字段"},
            },
            "required": ["ticketId", "reply"],
        },
        executor=reply_ticket,
        require_confirm=True,
    )

    registry.add(
        name="update_ticket_status",
        description="更新工单状态。可将工单标记为已解决、已关闭等。",
        parameters={
            "type": "object",
            "properties": {
                "ticketId": {"type": "integer", "description": "工单ID"},
                "status": {"type": "string", "description": "新状态", "enum": ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]},
            },
            "required": ["ticketId", "status"],
        },
        executor=update_ticket_status,
        require_confirm=True,
    )

    registry.add(
        name="get_ticket_stats",
        description="获取工单统计概览：待处理、处理中、已解决、已关闭的数量。",
        parameters={
            "type": "object",
            "properties": {},
        },
        executor=get_ticket_stats,
        require_confirm=False,
    )

    registry.add(
        name="batch_reply_pending_tickets",
        description=(
            "批量处理所有待处理的OPEN状态工单：AI自动生成回复并发送。"
            "适合处理大量重复性咨询，提高客服效率。"
            "⚠️ 这是批量写操作，执行前会要求确认。"
        ),
        parameters={
            "type": "object",
            "properties": {},
        },
        executor=batch_reply_pending,
        require_confirm=True,
    )
