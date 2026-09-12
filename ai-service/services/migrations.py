"""数据库结构自检：补齐 CopilotOperation 模型与既有表的列差异。

历史背景：CopilotOperation 模型在迭代中新增了 message_id / error_message / duration_ms 三列，
但应用启动只调 Base.metadata.create_all，不会给已存在表加列，导致
GET /api/copilot/operations 报 UndefinedColumnError。

此脚本是幂等的：仅在缺列时 ALTER，可重复执行。
"""
from __future__ import annotations

import asyncio
import logging

from sqlalchemy import text

from core.db import engine

logger = logging.getLogger(__name__)

EXPECTED_COLUMNS = {
    "message_id": "VARCHAR(64)",
    "error_message": "TEXT",
    "duration_ms": "INTEGER",
}


async def ensure_copilot_operation_columns() -> int:
    added = 0
    async with engine.begin() as conn:
        rows = await conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='copilot_operations'"
            )
        )
        existing = {r[0] for r in rows}
        for col, ddl in EXPECTED_COLUMNS.items():
            if col not in existing:
                sql = f"ALTER TABLE copilot_operations ADD COLUMN {col} {ddl}"
                logger.info("Applying migration: %s", sql)
                await conn.execute(text(sql))
                added += 1
    if added:
        logger.info("Added %d missing column(s) to copilot_operations", added)
    return added


async def main() -> None:
    n = await ensure_copilot_operation_columns()
    print(f"Added {n} column(s).")


if __name__ == "__main__":
    asyncio.run(main())
