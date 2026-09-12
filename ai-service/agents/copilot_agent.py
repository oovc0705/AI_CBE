"""Admin Copilot Agent：面向运营/管理员的 AI 助手。

能力：数据问答（NL2SQL）、运营操作（改价/下架）、订单退款、营销文案、翻译。
安全：所有写操作必须人工确认。
"""
from __future__ import annotations

from typing import List

from config import settings
from tools import tool_registry
from .agent_orchestrator import AgentOrchestrator

SYSTEM_PROMPT = """你是「运营 Copilot」，一个跨境电商平台的 AI 运营助手。

【你的服务对象】平台的运营人员和管理员。
【你的目标】用自然语言帮他们完成日常运营任务，让数据查询、商品管理、文案创作更高效。

【你能做的事】
1. 数据洞察：把运营的数据类问题转成 SQL 查询，并对结果做解读（涨跌、异常、建议）。
2. 商品运营：查询商品列表、查单个商品库存、调整价格、上下架、补货、批量改价/上下架/补货。
3. 订单售后：查询订单、查询物流轨迹、更新订单状态、发货、处理退款、导出订单。
4. 用户管理：查询后台用户列表与详情。
5. 营销促销：创建/更新优惠券、启用/停用促销活动。
6. 知识检索：检索 Copilot 知识库（运营手册、SQL 表结构、平台政策）。
7. 内容创作：生成多语言营销文案、翻译（适配多国市场）。

【必须遵守的规则】
- 数据查询只用 SELECT/WITH，绝不构造改写数据的 SQL。
- 生成 SQL 前先调用 search_copilot_kb 检索表结构和示例，提高准确率。
- 涉及价格、库存、退款、上下架、发货、订单状态、优惠券、促销活动、批量操作、数据导出等"写操作"时：先用一两句话说明你将做什么，然后发起工具调用，系统会要求人工确认。不要试图绕过确认。
- 对数字保持精确：商品ID、订单号、金额必须原样引用，不要编造。
- 如果工具返回 [MOCK] 开头，说明后端未连接，要如实告知用户这是模拟数据。
- 用中文回复，简洁专业，必要时用列表/表格。

【回答风格】
- 先给结论，再给依据。
- 数据变化要标注方向（↑/↓）和幅度。
- 给建议但不擅自执行写操作。
"""


# Copilot 可用的工具白名单（客服 Agent 不会有这些写操作权限）
ALLOWED_TOOLS: List[str] = [
    # 商品运营
    "query_products",
    "check_inventory",          # 查询单个商品库存
    "update_product_price",     # 写：改价
    "set_product_status",       # 写：上下架
    "restock_product",          # 写：补货
    "batch_update_prices",      # 写：批量改价
    "batch_set_status",         # 写：批量上下架
    "batch_restock",            # 写：批量补货
    # 订单售后
    "query_orders",
    "query_order_shipping",     # 查询订单物流
    "update_order_status",      # 写：更新订单状态
    "ship_order",               # 写：发货
    "process_refund",           # 写：退款
    "export_orders",            # 写：导出订单
    # 用户管理
    "query_users",
    "query_user_profile",
    # 营销促销
    "create_coupon",            # 写：创建优惠券
    "update_coupon",            # 写：更新优惠券
    "toggle_promotion",         # 写：启用/停用促销
    # 数据、知识与内容
    "query_business_data",      # NL2SQL 数据查询
    "search_copilot_kb",        # 检索 Copilot 知识库
    "export_products",          # 写：导出商品
    "generate_marketing_copy",
    "translate_text",
    # 售后工单（管理员 Copilot 可操作）
    "list_support_tickets",
    "get_ticket_detail",
    "generate_ai_reply",
    "reply_ticket",             # 写：回复工单
    "update_ticket_status",     # 写：更新工单状态
    "batch_reply_pending_tickets",  # 写：批量回复待处理工单
    "get_ticket_stats",
]


class CopilotAgent(AgentOrchestrator):
    """运营 Copilot。"""

    def __init__(self) -> None:
        super().__init__(
            system_prompt=SYSTEM_PROMPT,
            tools=tool_registry,
            allowed_tool_names=ALLOWED_TOOLS,
            model=settings.models.tool,  # Copilot 优先用工具能力强的模型
        )


# 模块级单例（应用启动后由 main.py 确保工具已注册）
copilot_agent = CopilotAgent()
