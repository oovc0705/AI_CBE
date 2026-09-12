"""Agent 层：面向不同角色的智能体。

每个 Agent：
- 有自己的系统提示词（角色、边界、安全规则）。
- 共享同一套工具注册表（按角色裁剪可用工具）。
- 通过编排器（orchestrator）驱动「思考 → 调用工具 → 确认 → 执行 → 总结」循环。
"""
from .copilot_agent import CopilotAgent, copilot_agent
from .customer_agent import CustomerAgent, customer_agent

__all__ = [
    "CopilotAgent",
    "copilot_agent",
    "CustomerAgent",
    "customer_agent",
]
