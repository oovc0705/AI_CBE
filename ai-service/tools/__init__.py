"""业务工具层：Agent 通过 Function Calling 调用的「动作」。

每个工具对应 Java 后端的一个 REST API。本模块负责：
1. 向 LLM 声明工具的 schema（OpenAI tools 格式）。
2. 收到 LLM 的工具调用后，转发到 Java 后端并把结果返回给 LLM。
3. 标注写操作（require_confirm），由 Agent 编排层在执行前等待人工确认。
"""
from .base import ToolResult, http_client, ToolRegistry, tool_registry
from .product_tools import register as register_product_tools
from .order_tools import register as register_order_tools
from .analytics_tools import register as register_analytics_tools
from .content_tools import register as register_content_tools
from .faq_tools import register as register_faq_tools
from .cart_tools import register as register_cart_tools
from .coupon_tools import register as register_coupon_tools
from .copilot_kb_tools import register as register_copilot_kb_tools
from .export_tools import register as register_export_tools
from .user_tools import register as register_user_tools
from .shipping_tools import register as register_shipping_tools
from .support_tools import register as register_support_tools
from .dashboard_tools import register as register_dashboard_tools


def register_all() -> ToolRegistry:
    """注册全部业务工具，返回注册表。应用启动时调用一次。"""
    register_product_tools(tool_registry)
    register_order_tools(tool_registry)
    register_analytics_tools(tool_registry)
    register_content_tools(tool_registry)
    register_faq_tools(tool_registry)
    register_cart_tools(tool_registry)
    register_coupon_tools(tool_registry)
    register_copilot_kb_tools(tool_registry)
    register_export_tools(tool_registry)
    register_user_tools(tool_registry)
    register_shipping_tools(tool_registry)
    register_support_tools(tool_registry)
    register_dashboard_tools(tool_registry)
    return tool_registry


__all__ = [
    "ToolResult",
    "http_client",
    "ToolRegistry",
    "tool_registry",
    "register_all",
]
