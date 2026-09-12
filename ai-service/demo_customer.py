"""命令行演示：智能客服多语言对话 + RAG FAQ 检索。

用法：
    python demo_customer.py

演示：
- 自动语言检测（中/英/日/韩等多语言）
- FAQ 知识库检索（退货/物流/关税/支付/尺码/保修）
- 订单查询（按 user_id 隔离）
- SSE 事件流式输出
"""
from __future__ import annotations

import asyncio
import json
import logging

from agents import customer_agent
from core.session_manager import session_manager
from tools import register_all


def _print_event(event: dict) -> None:
    t = event.get("type")
    if t == "session":
        print(f"\n[会话] {event['session_id']} | 用户: {event.get('user_id')}")
    elif t == "tool_call":
        print(f"\n🔧 检索 {event['name']}（参数：{json.dumps(event['args'], ensure_ascii=False)}）")
    elif t == "tool_result":
        mark = "✅" if event.get("success") else "❌"
        print(f"   {mark} {event['result'][:200]}{'...' if len(str(event['result'])) > 200 else ''}")
    elif t == "final":
        lang = event.get("language", {})
        if lang:
            print(f"\n🌐 检测语言: {lang['name']} (置信度 {lang['confidence']})")
        print(f"\n🤖 {event['content']}")
    elif t == "error":
        print(f"\n❌ {event['message']}")


async def chat_turn(session_id: str, user_input: str, user_id: str) -> None:
    async for event in customer_agent.run(
        session_id, user_input, enable_tools=True, caller_user_id=user_id
    ):
        _print_event(event)


async def main() -> None:
    logging.basicConfig(level=logging.WARNING)
    register_all()

    # 模拟一个 C 端用户（实际从 storefront JWT 获取）
    user_id = "user_8421"

    print("=" * 60)
    print("  AI-CBE 智能客服演示")
    print(f"  模拟用户: {user_id}")
    print("  输入你的问题，支持中/英/日/韩等多语言，输入 exit 退出")
    print("  示例：")
    print("    - 退货流程是什么？")
    print("    - How do I track my order?")
    print("    - 発送到日本要多久？")
    print("    - 関税は誰が払いますか？")
    print("    - 我想查一下我的订单")
    print("=" * 60)

    session_id = session_manager.new_session_id("cust")

    while True:
        try:
            user_input = input("\n顾客 ▶ ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n再见")
            break
        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit", "退出"}:
            print("再见")
            break

        await chat_turn(session_id, user_input, user_id)


if __name__ == "__main__":
    asyncio.run(main())
