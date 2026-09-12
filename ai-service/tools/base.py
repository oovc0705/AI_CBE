"""工具基础设施：HTTP 客户端 + 工具注册表。

设计：
- 所有对 Java 后端的调用都走同一个 http_client，统一鉴权与超时。
- ToolRegistry 管理工具 schema 与执行器，Agent 只需查询注册表即可。
- 写操作通过 require_confirm=True 标记，由编排层在执行前拦截。
- 前端传入的 admin token 通过 contextvar 透传给 Java 后端，避免使用固定 token。
"""
from __future__ import annotations

import contextvars
import logging
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

# 当前请求的 admin token，由 Agent 编排层在调用工具前设置
auth_token_context: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "auth_token", default=None
)

# 工具执行器签名：输入参数 dict，返回 ToolResult
ToolExecutor = Callable[[Dict[str, Any]], Awaitable["ToolResult"]]


@dataclass
class ToolResult:
    """工具执行结果。统一格式，方便 LLM 解析。"""
    success: bool
    data: Any = None
    message: str = ""
    requires_confirm: bool = False  # 写操作执行前需人工确认

    def to_llm_str(self) -> str:
        """供 LLM 阅读的紧凑文本。"""
        if not self.success:
            return f"[ERROR] {self.message}"
        if self.data is None:
            return self.message or "[OK]"
        return f"{self.message or '[OK]'} | {self.data}"


# 共享 HTTP 客户端：连接池复用
class HttpClient:
    """对 Java 后端的 HTTP 客户端封装。"""

    def __init__(self) -> None:
        self._client: Optional[httpx.AsyncClient] = None

    async def get(self) -> httpx.AsyncClient:
        if self._client is None:
            # 注意：鉴权头不能放在这里。客户端是复用的，
            # 固化 token 会让后续所有请求都带第一个用户的身份。
            self._client = httpx.AsyncClient(
                base_url=settings.java_api_base_url,
                headers={"Content-Type": "application/json"},
                timeout=30.0,
            )
        return self._client

    @staticmethod
    def _auth_headers() -> Dict[str, str]:
        """按请求动态取鉴权头：优先当前请求上下文的 token，回落到配置的固定 token。"""
        token = auth_token_context.get() or settings.java_api_token
        return {"Authorization": f"Bearer {token}"} if token else {}

    async def get_json(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        client = await self.get()
        resp = await client.get(path, params=params, headers=self._auth_headers())
        resp.raise_for_status()
        return resp.json()

    async def post_json(self, path: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        client = await self.get()
        resp = await client.post(path, json=payload or {}, headers=self._auth_headers())
        resp.raise_for_status()
        return resp.json()

    async def put_json(self, path: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        client = await self.get()
        resp = await client.put(path, json=payload or {}, headers=self._auth_headers())
        resp.raise_for_status()
        return resp.json()

    async def patch_json(self, path: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        client = await self.get()
        resp = await client.patch(path, json=payload or {}, headers=self._auth_headers())
        resp.raise_for_status()
        return resp.json()

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None


http_client = HttpClient()


@dataclass
class ToolEntry:
    """单个工具的元信息：OpenAI schema + 执行器 + 是否写操作。"""
    name: str
    description: str
    parameters: Dict[str, Any]          # JSON Schema
    executor: ToolExecutor
    require_confirm: bool = False       # 写操作需人工确认

    def to_openai_schema(self) -> Dict[str, Any]:
        """转为 OpenAI Function Calling 格式。"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    """工具注册表。应用启动时 register_all() 一次性注册。"""

    def __init__(self) -> None:
        self._tools: Dict[str, ToolEntry] = {}

    def add(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        executor: ToolExecutor,
        require_confirm: bool = False,
    ) -> None:
        if name in self._tools:
            logger.warning("Tool %s already registered, overwriting", name)
        self._tools[name] = ToolEntry(
            name=name,
            description=description,
            parameters=parameters,
            executor=executor,
            require_confirm=require_confirm,
        )

    def get(self, name: str) -> Optional[ToolEntry]:
        return self._tools.get(name)

    def names(self) -> List[str]:
        return list(self._tools.keys())

    def to_openai_schemas(self) -> List[Dict[str, Any]]:
        return [t.to_openai_schema() for t in self._tools.values()]

    async def execute(self, name: str, args: Dict[str, Any]) -> ToolResult:
        """执行指定工具。写操作需由编排层在调用前确认，本方法不二次拦截。"""
        entry = self.get(name)
        if entry is None:
            return ToolResult(success=False, message=f"未知工具: {name}")
        try:
            return await entry.executor(args)
        except Exception as e:
            logger.exception("Tool %s failed", name)
            return ToolResult(success=False, message=f"工具执行异常: {e}")


# 模块级注册表
tool_registry = ToolRegistry()


def propagate_error(e: Exception, context: str = "") -> ToolResult:
    """Java 后端调用失败时的统一处理: 直接报错,不再回退到 MOCK。

    设计目标（Admin Copilot 真实连接模式）：
    - 所有 Admin 操作必须真实落到 Java 后端 + 数据库。
    - 任何 HTTP 异常、连接错误、4xx/5xx 都直接暴露给调用方。
    - 不再返回「假数据」骗用户。

    Args:
        e: 底层异常（httpx.HTTPError、连接错误等）
        context: 上下文描述，如 '获取用户列表'，用于错误消息
    """
    logger.error("Java API call failed: %s | %s", context, e)
    prefix = f"{context}失败" if context else "Java 后端调用失败"
    return ToolResult(success=False, message=f"{prefix}: {e}")


# 保留旧名称以兼容历史引用（已改为 propagate_error 语义）
def mock_or_error(e: Exception, mock_result: ToolResult) -> ToolResult:
    """兼容旧签名：直接走 propagate_error,不再返回 mock 数据。

    注意: 旧的 mock 数据已移除,任何调用此函数的代码都会得到真实错误。
    """
    return propagate_error(e, context=mock_result.message)
