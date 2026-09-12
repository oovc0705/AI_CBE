"""全局配置：从环境变量读取，提供类型安全的访问入口。

设计要点：
- 单一 settings 实例，全局复用。
- 模型路由通过 LiteLLM provider 前缀（deepseek/ / zhipu/ / ollama/）自动派发，
  无需在业务代码里关心具体厂商。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from os import environ
from typing import List

# 自动加载 .env（python-dotenv），让本地配置无需手动 export
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv 未安装时静默跳过，依赖系统环境变量
    pass


def _get(key: str, default: str = "") -> str:
    return environ.get(key, default).strip()


def _get_list(key: str, default: str = "") -> List[str]:
    raw = _get(key, default)
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def _get_bool(key: str, default: bool = False) -> bool:
    return _get(key, str(default)).lower() in {"1", "true", "yes", "on"}


def _get_int(key: str, default: int) -> int:
    try:
        return int(_get(key, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class ModelRouting:
    """模型路由策略：不同任务可指向不同模型，便于成本/效果权衡。"""
    chat: str = _get("MODEL_CHAT", "ollama/qwen2.5:7b")
    tool: str = _get("MODEL_TOOL", "ollama/qwen2.5:7b")
    embedding: str = _get("MODEL_EMBEDDING", "BAAI/bge-m3")

    @property
    def chat_provider(self) -> str:
        return self.chat.split("/", 1)[0]

    @property
    def tool_provider(self) -> str:
        return self.tool.split("/", 1)[0]


@dataclass(frozen=True)
class Settings:
    # ---- 运行环境 ----
    app_env: str = _get("APP_ENV", "local")
    app_host: str = _get("APP_HOST", "0.0.0.0")
    app_port: int = _get_int("APP_PORT", 8000)
    log_level: str = _get("LOG_LEVEL", "INFO")

    # ---- 模型 API Keys ----
    deepseek_api_key: str = _get("DEEPSEEK_API_KEY")
    zhipu_api_key: str = _get("ZHIPU_API_KEY")
    dashscope_api_key: str = _get("DASHSCOPE_API_KEY")
    openai_api_key: str = _get("OPENAI_API_KEY")
    stepfun_api_key: str = _get("STEPFUN_API_KEY")

    # ---- 模型路由 ----
    models: ModelRouting = field(default_factory=ModelRouting)

    # ---- Ollama ----
    ollama_base_url: str = _get("OLLAMA_BASE_URL", "http://localhost:11434")

    # ---- Java 后端 ----
    java_api_base_url: str = _get("JAVA_API_BASE_URL", "http://localhost:8081")
    java_api_token: str = _get("JAVA_API_TOKEN")

    # ---- Redis ----
    redis_url: str = _get("REDIS_URL", "redis://localhost:6379/0")
    session_ttl_seconds: int = _get_int("SESSION_TTL_SECONDS", 86400)

    # ---- Database（Copilot 历史持久化）----
    database_url: str = _get(
        "DATABASE_URL",
        "postgresql+asyncpg://admin:admin@localhost:5432/ai_cbe",
    )

    # ---- 向量库 ----
    chroma_base_url: str = _get("CHROMA_BASE_URL", "http://localhost:8001")
    chroma_collection_copilot: str = _get("CHROMA_COLLECTION_COPILIT", "copilot_kb")
    chroma_collection_customer: str = _get("CHROMA_COLLECTION_CUSTOMER", "customer_kb")

    # ---- Copilot 安全策略 ----
    require_human_confirm_write: bool = _get_bool("REQUIRE_HUMAN_CONFIRM_WRITE", True)

    # ---- 工具层策略 ----
    # Java 后端不可用时是否回退到 MOCK 数据（local 默认开，生产应关闭以暴露真实错误）
    enable_mock_fallback: bool = _get_bool("ENABLE_MOCK_FALLBACK", True)

    # ---- CORS ----
    cors_origins: List[str] = field(
        default_factory=lambda: _get_list(
            "CORS_ORIGINS", "http://localhost:3000,http://localhost:3001"
        )
        or ["http://localhost:3000", "http://localhost:3001"]
    )

    @property
    def is_local(self) -> bool:
        return self.app_env == "local"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """单例：避免重复解析环境变量。"""
    return Settings()


# 模块级实例，业务代码直接 `from config import settings` 使用
settings = get_settings()
