"""命令行演示：跑通 Copilot「数据问答 → 操作建议 → 人工确认 → 执行」全流程。

用法：
    python demo_copilot.py

不依赖前端，直接在终端里和 Copilot 对话。写操作会在终端询问确认。
"""
from __future__ import annotations

import asyncio
import json
import logging

from agents import copilot_agent
from core.session_manager import session_manager
from tools import register_all


def _print_event(event: dict) -> None:
    t = event.get("type")
    if t == "session":
        print(f"\n[会话] {event['session_id']}")
    elif t == "tool_call":
        flag = " ⚠️需确认" if event.get("require_confirm") else ""
        print(f"\n🔧 调用工具 {event['name']}{flag}")
        print(f"   参数: {json.dumps(event['args'], ensure_ascii=False)}")
    elif t == "tool_result":
        mark = "✅" if event.get("success") else "❌"
        print(f"   {mark} 结果: {event['result']}")
    elif t == "confirm":
        print(f"\n⚠️  等待确认: {event['message']}")
    elif t == "final":
        print(f"\n🤖 {event['content']}")
    elif t == "error":
        print(f"\n❌ 错误: {event['message']}")


_OPERATOR = {"userId": "local_cli", "name": "CLI", "access": "admin"}


async def chat_turn(session_id: str, user_input: str) -> dict | None:
    """一轮对话。返回挂起的写操作确认事件（如有）。"""
    pending = None
    async for event in copilot_agent.run(
        session_id, user_input, operator_info=_OPERATOR
    ):
        _print_event(event)
        if event.get("type") == "confirm":
            pending = event
    return pending


async def confirm_turn(session_id: str, pending: dict) -> None:
    ans = input("\n是否确认执行？(y/N): ").strip().lower()
    confirmed = ans in {"y", "yes", "是"}
    async for event in copilot_agent.resume_after_confirm(
        session_id,
        confirmed,
        operator_info=_OPERATOR,
        confirm_token=pending.get("confirm_token"),
    ):
        _print_event(event)


async def main() -> None:
    logging.basicConfig(level=logging.WARNING)
    register_all()

    print("=" * 60)
    print("  AI-CBE 运营 Copilot 演示")
    print("  输入你的运营问题，输入 exit 退出")
    print("  示例：")
    print("    - 上周哪些品类销量跌了？")
    print("    - 帮我把库存低于10的商品下架")
    print("    - 给无线降噪耳机 Pro 写一份英文营销文案")
    print("=" * 60)

    session_id = session_manager.new_session_id("copilot")

    while True:
        try:
            user_input = input("\n你 ▶ ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见")
            break
        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit", "退出"}:
            print("再见")
            break

        pending = await chat_turn(session_id, user_input)
        if pending:
            await confirm_turn(session_id, pending)


if __name__ == "__main__":
    asyncio.run(main())
