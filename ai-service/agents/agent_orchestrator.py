"""Agent 编排器：驱动「思考 → 工具调用 → 人工确认 → 执行 → 总结」循环。

不依赖 LangGraph 的复杂状态图（降低本地调试门槛），用纯 async 循环实现。
循环上限保护，避免无限调用。写操作会挂起并持久化到 Redis，只有通过结构化
确认接口（POST /api/copilot/confirm 或前端按钮）才会执行；确认记录绑定发起
用户与角色，避免跨用户确认或只读角色越权。

事件流（前端可订阅）：
- "thought"    模型思考/普通回复
- "tool_call"  即将调用工具（含名称、参数、是否需确认）
- "confirm"    等待人工确认（写操作），携带 confirm_token
- "tool_result"工具执行结果
- "final"      最终回复
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Any, AsyncIterator, Awaitable, Callable, Dict, List, Optional

from core.audit_logger import log_write_operation
from core.model_router import model_router
from core.session_manager import session_manager
from tools.base import ToolRegistry

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 6  # 单轮对话最多工具调用次数


def _operator_user_id(operator_info: Optional[Dict[str, Any]]) -> Optional[str]:
    """从鉴权信息中取当前操作人 ID。"""
    if not operator_info:
        return None
    return operator_info.get("userId") or operator_info.get("id")


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
        self.allowed = set(allowed_tool_names) if allowed_tool_names is not None else None
        self.model = model

    # ------------------------------------------------------------------
    def _available_schemas(self) -> List[Dict[str, Any]]:
        """只暴露本 Agent 被授权使用的工具。"""
        all_schemas = {}
        # 重建 schema 列表，按 allowed 过滤
        for name in self.tools.names():
            if self.allowed is not None and name not in self.allowed:
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
        """执行 Redis 中挂起的写操作并生成总结。

        执行前复核：操作归属用户、调用方角色、工具白名单。
        """
        owner = pending.get("user_id")
        current = _operator_user_id(operator_info)
        if not owner or not current or owner != current:
            yield {
                "type": "final",
                "content": "该待确认操作不属于当前账号，无法执行。",
            }
            return

        role = operator_info.get("access") if operator_info else None
        if role in ("viewer", "user"):
            yield {
                "type": "final",
                "content": f"当前账号为 {role} 只读角色，无法执行写操作。",
            }
            return

        if self.allowed is not None and pending.get("tool_name") not in self.allowed:
            await session_manager.set_pending(session_id, None)
            yield {
                "type": "final",
                "content": f"工具 `{pending.get('tool_name')}` 未获当前 Agent 授权，操作已取消。",
            }
            return

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
        遇到写操作会产出 confirm 事件并挂起；只有通过结构化确认接口才能继续。
        """
        # 0) 存在挂起的写操作时，只允许通过结构化确认接口继续，不再从自然语言推断
        pending = await session_manager.get_pending(session_id)
        if pending:
            owner = pending.get("user_id")
            current = _operator_user_id(operator_info)
            if not owner:
                # 旧版本遗留的 pending 没有归属信息，直接作废，避免被任意账号确认
                await session_manager.set_pending(session_id, None)
                yield {
                    "type": "final",
                    "content": "检测到旧版待确认操作（缺少归属信息），已作废，请重新发起。",
                }
                return
            if not current or owner != current:
                yield {
                    "type": "final",
                    "content": "当前会话有待确认的写操作，但不属于当前账号，无法处理。",
                }
                return

            yield {
                "type": "confirm",
                "session_id": session_id,
                "tool_name": pending["tool_name"],
                "args": pending["args"],
                "message": pending.get("message", ""),
                "confirm_token": pending.get("confirm_token", ""),
            }
            yield {
                "type": "final",
                "content": (
                    f"仍等待确认操作 `{pending['tool_name']}`。\n"
                    f"请点击「确认执行」或「取消」按钮完成操作。"
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

                # 执行期强制白名单：模型即使被诱导产出未暴露的工具名，也不允许执行
                if self.allowed is not None and fn.name not in self.allowed:
                    logger.warning(
                        "Blocked unauthorized tool call: agent=%s tool=%s",
                        type(self).__name__, fn.name,
                    )
                    denied = f"[ERROR] 工具 `{fn.name}` 未获当前 Agent 授权"
                    yield {
                        "type": "tool_result",
                        "name": fn.name,
                        "result": denied,
                        "success": False,
                    }
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "name": fn.name,
                        "content": denied,
                    })
                    continue

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

                    # 写操作：必须能确定操作人，否则拒绝挂起
                    operator_id = _operator_user_id(operator_info)
                    if not operator_id:
                        yield {
                            "type": "final",
                            "content": "无法确定操作人身份，已拒绝执行写操作。",
                        }
                        return

                    # 写操作：持久化挂起到 Redis，并等待前端按钮结构化确认
                    pending = {
                        "tool_name": fn.name,
                        "args": args,
                        "message": f"即将执行写操作 `{fn.name}`，参数：{args}",
                        "tool_call_id": tc.id,
                        "messages": [m.copy() for m in messages],
                        "user_id": operator_id,
                        "role": role,
                        "confirm_token": uuid.uuid4().hex,
                    }
                    await session_manager.set_pending(session_id, pending)

                    confirm_msg = (
                        f"我将执行写操作 `{fn.name}`，参数如下：\n"
                        f"```json\n{json.dumps(args, ensure_ascii=False, indent=2)}\n```\n"
                        f"请在下方点击「确认执行」或「取消」。"
                    )
                    yield {
                        "type": "confirm",
                        "session_id": session_id,
                        "tool_name": fn.name,
                        "args": args,
                        "message": pending["message"],
                        "confirm_token": pending["confirm_token"],
                    }
                    yield {"type": "final", "content": confirm_msg}
                    await session_manager.append_message(
                        session_id, {"role": "assistant", "content": confirm_msg}
                    )
                    all_confirmed = False
                    break  # 暂停循环，等待结构化确认
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
                # 有写操作挂起，上下文已保存在 pending.messages 中，等结构化确认
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
        confirm_token: Optional[str] = None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """结构化确认入口：前端/命令行提交明确的确认或取消。

        confirm_token 必须是 confirm 事件中下发的令牌，防止确认到已被替换的操作。
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

        expected = pending.get("confirm_token")
        if not confirm_token or not expected or confirm_token != expected:
            yield {
                "type": "final",
                "content": "确认令牌无效或已过期，请重新发起操作。",
            }
            return

        async for event in self._execute_pending(
            session_id, pending, confirmed, operator_info
        ):
            yield event
