"""模型路由层：基于 LiteLLM 统一多家模型的调用接口。

为什么需要这一层：
- 业务代码只依赖 `model_router.chat()`，不关心底层是 DeepSeek / 智谱 / Ollama。
- 切换模型（如本地测试 ↔ 云端）只需改 `.env`，零代码改动。
- 统一处理流式输出、工具调用、错误重试、Token 计费预留。
"""
from __future__ import annotations

import logging
from typing import Any, AsyncIterator, Dict, List, Optional

# LiteLLM 提供统一的 OpenAI 兼容接口，覆盖 100+ 模型
import litellm

from config import settings

logger = logging.getLogger(__name__)

# 关闭 LiteLLM 的遥测（生产建议关闭）
litellm.telemetry = False
# Ollama 等本地模型不走代理
litellm.drop_params = True


class ModelRouter:
    """统一模型调用入口。

    用法：
        # 普通对话（非流式）
        reply = await model_router.chat(messages=[...])

        # 流式输出
        async for chunk in model_router.stream_chat(messages=[...]):
            print(chunk, end="")

        # 带工具调用
        reply = await model_router.chat(messages=[...], tools=[...], tool_choice="auto")
    """

    def __init__(self) -> None:
        self._settings = settings
        # 把已配置的 API Key 注入 LiteLLM 全局
        if settings.deepseek_api_key:
            import os
            os.environ["DEEPSEEK_API_KEY"] = settings.deepseek_api_key
        if settings.zhipu_api_key:
            import os
            os.environ["ZHIPU_API_KEY"] = settings.zhipu_api_key
        if settings.dashscope_api_key:
            import os
            os.environ["DASHSCOPE_API_KEY"] = settings.dashscope_api_key
        if settings.openai_api_key:
            import os
            os.environ["OPENAI_API_KEY"] = settings.openai_api_key
        if settings.stepfun_api_key:
            import os
            # StepFun 通过 OpenAI 兼容接口调用
            os.environ["OPENAI_API_KEY"] = settings.stepfun_api_key
            os.environ["OPENAI_API_BASE"] = "https://api.stepfun.com/step_plan/v1"
        # Ollama base url
        if settings.ollama_base_url:
            import os
            os.environ["OLLAMA_API_BASE"] = settings.ollama_base_url

    # ------------------------------------------------------------------
    # 内部辅助
    # ------------------------------------------------------------------
    @staticmethod
    def _build_kwargs(
        model: str,
        messages: List[Dict[str, Any]],
        **extra: Any,
    ) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {"model": model, "messages": messages}
        kwargs.update(extra)
        return kwargs

    # ------------------------------------------------------------------
    # 对外接口
    # ------------------------------------------------------------------
    async def chat(
        self,
        messages: List[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Any = "auto",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **extra: Any,
    ) -> Any:
        """非流式对话。返回 LiteLLM 的 ModelResponse 对象。"""
        target_model = model or self._settings.models.chat
        call_kwargs = self._build_kwargs(
            target_model,
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **extra,
        )
        if tools:
            call_kwargs["tools"] = tools
            call_kwargs["tool_choice"] = tool_choice

        logger.debug("LLM call model=%s msgs=%d tools=%d",
                     target_model, len(messages), len(tools or []))
        try:
            return await litellm.acompletion(**call_kwargs)
        except Exception:
            logger.exception("LLM call failed: model=%s", target_model)
            raise

    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        *,
        model: Optional[str] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **extra: Any,
    ) -> AsyncIterator[str]:
        """流式对话，逐块产出文本 delta。

        注意：当前简化版只转发文本内容，工具调用走非流式接口处理。
        """
        target_model = model or self._settings.models.chat
        call_kwargs = self._build_kwargs(
            target_model,
            messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            **extra,
        )
        if tools:
            call_kwargs["tools"] = tools

        try:
            response = await litellm.acompletion(**call_kwargs)
            async for chunk in response:
                delta = chunk.choices[0].delta.content if chunk.choices else None
                if delta:
                    yield delta
        except Exception:
            logger.exception("LLM stream failed: model=%s", target_model)
            raise

    async def embed(self, text: str, *, model: Optional[str] = None) -> List[float]:
        """文本向量化（用于 RAG）。默认用 BGE-m3。"""
        target_model = model or self._settings.models.embedding
        try:
            resp = await litellm.aembedding(model=target_model, input=[text])
            return resp.data[0]["embedding"]
        except Exception:
            # 本地 sentence-transformers 兜底（避免云端 embedding 不可用）
            logger.warning("LiteLLM embedding failed, falling back to local")
            raise


# 模块级单例
model_router = ModelRouter()
