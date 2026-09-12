"""异步数据库连接管理（SQLAlchemy 2.0）。

Copilot 历史会话、消息、操作审计持久化到 Postgres。
"""
from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import settings

Base = declarative_base()

engine = create_async_engine(
    settings.database_url,
    echo=settings.is_local and settings.log_level.upper() == "DEBUG",
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Depends 用的异步会话生成器。"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """应用启动时创建所有表。"""
    # 避免循环导入：模型在调用 init_db 时应该已导入
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
