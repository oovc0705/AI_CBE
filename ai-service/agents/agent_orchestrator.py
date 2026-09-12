"""Agent 编排器：驱动「思考 → 工具调用 → 人工确认 → 执行 → 总结」循环。

不依赖 LangGraph 的复杂状态图（降低本地调试门槛），用纯 async 循环实现。
循环上限保护，避免无限调用。写操作会先在输出中请求用户确认，用户回复
「确认/取消」后继续执行；挂起状态持久化到 Redis，服务重启仍可恢复。

事件流（前端可订阅）：
- "thought"    模型思考/普通回复
- "tool_call"  即将调用工具（含名称、参数、是否需确认）
- "confirm"    等待人工确认（写操作）—— 仅用于兼容旧前端/API
- "tool_result"工具执行结果
- "final"      最终回复
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator, Awaitable, Callable, Dict, List, Optional

from core.audit_logger import log_write_operation
from core.model_router import model_router
from core.session_manager import session_manager
from tools.base import ToolRegistry

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 6  # 单轮对话最多工具调用次数

# 用户确认意图关键词
_CONFIRM_WORDS = {"确认", "确定", "是的", "是", "ok", "yes", "y", "执行", "继续"}
_CANCEL_WORDS = {"取消", "不", "否", "no", "n", "拒绝", "算了"}


def _parse_confirm_intent(text: str) -> str:
    """解析用户回复是确认、取消还是无关。"""
    t = (text or "").strip().lower()
    # 先检查取消，避免「不确认」「不要执行」被误判为确认
    if any(w in t for w in _CANCEL_WORDS):
        return "cancel"
    if any(w in t for w in _CONFIRM_WORDS):
        return "confirm"
    return "unknown"


class AgentOrchestrator:
    """通用 Agent 编排器。Copilot / 客服 Agent 共用它，差异在系统提示词与工具集。"""

    def __init__(
        self,
        system_prompt: str,
        tools: ToolRegistry,
        allowed_tool_names: Optional[List[str]] = None,
        model: Optional[str] = None,
    ) -> None:
        self.system_prompt = system_prompt
        self.tools = tools
        self.allowed = set(allowed_tool_names) if allowed_tool_names else None
        self.model = model

    # ------------------------------------------------------------------
    def _available_schemas(self) -> List[Dict[str, Any]]:
        """只暴露本 Agent 被授权使用的工具。"""
        all_schemas = {}
        # 重建 schema 列表，按 allowed 过滤
        for name in self.tools.names():
            if self.allowed and name not in self.allowed:
                continue
            all_schemas[name] = self.tools.get(name)
        return [t.to_openai_schema() for t in all_schemas.values() if t]

    def _build_messages(self, history: List[Dict[str, Any]],
                        user_input: str) -> List[Dict[str, Any]]:
        messages = [{"role": "system", "content": self.system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": user_input})
        return messages

    async def _execute_pending(
        self,
        session_id: str,
        pending: Dict[str, Any],
        confirmed: bool,
        operator_info: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """执行 Redis 中挂起的写操作并生成总结。"""
        if not confirmed:
            await session_manager.set_pending(session_id, None)
            yield {"type": "final", "content": f"已取消操作 `{pending['tool_name']}`。"}
            return

        result = await self.tools.execute(pending["tool_name"], pending["args"])
        yield {
            "type": "tool_result",
            "name": pending["tool_name"],
            "args": pending["args"],
            "result": result.to_llm_str(),
            "success": result.success,
        }

        # 记录审计日志
        await log_write_operation(
            session_id=session_id,
            tool_name=pending["tool_name"],
            args=pending["args"],
            result=result,
            operator_info=operator_info,
        )

        # 恢复挂起时的完整上下文，并把写操作结果追加进去
        messages = [m.copy() for m in pending["messages"]]
        tool_call_id = pending.get("tool_call_id") or f"pending_{pending['tool_name']}"
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": pending["tool_name"],
            "content": result.to_llm_str(),
        })

        # 让模型基于完整上下文给用户一个总结回复
        resp = await model_router.chat(messages, model=self.model or None)
        content = resp.choices[0].message.content or ""
        yield {"type": "final", "content": content}
        await session_manager.append_message(
            session_id, {"role": "assistant", "content": content}
        )
        await session_manager.set_pending(session_id, None)

    # ------------------------------------------------------------------
    async def run(
        self,
        session_id: str,
        user_input: str,
        *,
        enable_tools: bool = True,
        caller_user_id: Optional[str] = None,
        operator_info: Optional[Dict[str, Any]] = None,
        pre_hook: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """主循环：流式产出事件 dict。

        yield 的事件类型见模块 docstring。
        遇到写操作会在 final 事件中请求用户确认；用户回复「确认/取消」后，
        下次调用 run() 会继续执行。
        """
        # 0) 优先处理 Redis 中挂起的写操作
        pending = await session_manager.get_pending(session_id)
        if pending:
            intent = _parse_confirm_intent(user_input)
            if intent == "confirm":
                async for event in self._execute_pending(
                    session_id, pending, True, operator_info
                ):
                    yield event
                return
            if intent == "cancel":
                await session_manager.set_pending(session_id, None)
                yield {"type": "final", "content": f"已取消操作 `{pending['tool_name']}`。"}
                return
            # 无关回复：再次提示确认
            yield {
                "type": "final",
                "content": (
                    f"仍等待确认操作 `{pending['tool_name']}`。\n"
                    f"请回复「确认」执行，或回复「取消」放弃。"
                ),
            }
            return

        history = await session_manager.get_messages(session_id)
        messages = self._build_messages(history, user_input)

        # 记录用户输入到历史
        await session_manager.append_message(
            session_id, {"role": "user", "content": user_input}
        )

        tool_schemas = self._available_schemas() if enable_tools else []
        iterations = 0

        while iterations <= MAX_ITERATIONS:
            iterations += 1
            # 0) pre_hook：客服场景做语言检测/动态注入 system 信息
            if pre_hook is not None:
                try:
                    await pre_hook({"user_input": user_input, "messages": messages})
                except Exception:
                    logger.exception("pre_hook failed, continue without it")
                # 钩子可能改了 system_prompt，重建首条 system 消息
                if messages and messages[0]["role"] == "system":
                    messages[0]["content"] = self.system_prompt
                else:
                    messages.insert(0, {"role": "system", "content": self.system_prompt})

            # 1) 调用模型（非流式以便解析工具调用）
            resp = await model_router.chat(
                messages,
                model=self.model or None,
                tools=tool_schemas or None,
                tool_choice="auto" if tool_schemas else None,
            )
            msg = resp.choices[0].message
            tool_calls = getattr(msg, "tool_calls", None) or []

            # 2) 无工具调用 → 终结，输出文本
            if not tool_calls:
                content = msg.content or ""
                yield {"type": "final", "content": content}
                await session_manager.append_message(
                    session_id, {"role": "assistant", "content": content}
                )
                return

            # 3) 把 assistant 的工具调用意图追加进 messages（OpenAI 规范）
            assistant_msg: Dict[str, Any] = {"role": "assistant", "content": msg.content}
            assistant_msg["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in tool_calls
            ]
            messages.append(assistant_msg)

            # 4) 逐个处理工具调用
            all_confirmed = True
            for tc in tool_calls:
                fn = tc.function
                try:
                    args = json.loads(fn.arguments) if fn.arguments else {}
                except json.JSONDecodeError:
                    args = {}

                entry = self.tools.get(fn.name)
                need_confirm = bool(entry and entry.require_confirm)

                # 权限隔离：客服场景把 caller_user_id 注入到订单查询，
                # 避免顾客查到他人订单。仅对查询类工具生效。
                if caller_user_id and fn.name == "query_orders":
                    args.setdefault("user_id", caller_user_id)
                # 购物车查询需要 session_id 才能读取上下文（强制覆盖，防止模型瞎传）
                if fn.name == "query_cart":
                    args["session_id"] = session_id

                yield {
                    "type": "tool_call",
                    "name": fn.name,
                    "args": args,
                    "require_confirm": need_confirm,
                }

                if need_confirm:
                    # viewer / user 角色只读，禁止发起写操作
                    role = operator_info.get("access") if operator_info else None
                    if role in ("viewer", "user"):
                        yield {
                            "type": "final",
                            "content": (
                                f"当前账号为 {role} 只读角色，无法执行写操作 `{fn.name}`。"
                                f"如需执行，请联系管理员提升权限。"
                            ),
                        }
                        return

                    # 写操作：持久化挂起到 Redis，并在输出中请求确认
                    pending = {
                        "tool_name": fn.name,
                        "args": args,
                        "message": f"即将执行写操作 `{fn.name}`，参数：{args}",
                        "tool_call_id": tc.id,
                        "messages": [m.copy() for m in messages],
                    }
                    await session_manager.set_pending(session_id, pending)

                    confirm_msg = (
                        f"我将执行写操作 `{fn.name}`，参数如下：\n"
                        f"```json\n{json.dumps(args, ensure_ascii=False, indent=2)}\n```\n"
                        f"请回复「确认」执行，或回复「取消」放弃。"
                    )
                    yield {"type": "confirm", "tool_name": fn.name,
                           "args": args, "message": pending["message"]}
                    yield {"type": "final", "content": confirm_msg}
                    await session_manager.append_message(
                        session_id, {"role": "assistant", "content": confirm_msg}
                    )
                    all_confirmed = False
                    break  # 暂停循环，等用户回复
                else:
                    # 读操作：直接执行
                    result = await self.tools.execute(fn.name, args)
                    yield {"type": "tool_result", "name": fn.name,
                           "result": result.to_llm_str(), "success": result.success}
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": fn.name,
                        "content": result.to_llm_str(),
                    })

            if not all_confirmed:
                # 有写操作挂起，上下文已保存在 pending.messages 中，等用户回复
                return

            # 5) 继续循环：让模型基于工具结果继续

        # 超过迭代上限
        yield {"type": "final", "content": "（已达工具调用次数上限，停止处理）"}

    # ------------------------------------------------------------------
    async def resume_after_confirm(
        self,
        session_id: str,
        confirmed: bool,
        operator_info: Optional[Dict[str, Any]] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """兼容旧流程：前端/命令行直接对写操作给出确认/拒绝后，恢复执行。

        新流程推荐通过正常 chat 回复「确认/取消」继续。
        """
        # 安全兜底：viewer / user 不能恢复执行写操作
        role = operator_info.get("access") if operator_info else None
        if role in ("viewer", "user"):
            yield {"type": "final", "content": f"{role} 角色无权确认写操作。"}
            return

        pending = await session_manager.get_pending(session_id)
        if pending is None:
            yield {"type": "final", "content": "没有挂起的操作。"}
            return

        async for event in self._execute_pending(
            session_id, pending, confirmed, operator_info
        ):
            yield event
