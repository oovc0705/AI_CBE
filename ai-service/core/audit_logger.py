"""操作审计日志：记录所有写操作的关键信息。

设计：
- 以追加方式写入 ai-service/data/audit.log（JSONL）。
- 每条记录包含操作人、时间、工具、参数、结果摘要，便于事后追溯。
- 如果未来接入 Kafka / 数据库 / Loki，只需替换 write_log 实现即可。
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from config import settings

logger = logging.getLogger(__name__)

# 审计日志默认存放路径
DEFAULT_AUDIT_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "audit.log"


def _get_log_path() -> Path:
    raw = os.environ.get("AUDIT_LOG_PATH", "")
    if raw:
        return Path(raw)
    return DEFAULT_AUDIT_LOG_PATH


def _ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


async def log_write_operation(
    *,
    session_id: str,
    tool_name: str,
    args: Dict[str, Any],
    result: "ToolResult",  # type: ignore
    operator_info: Optional[Dict[str, Any]] = None,
) -> None:
    """记录一次写操作。

    参数：
    - session_id: 会话ID
    - tool_name: 工具名
    - args: 调用参数
    - result: ToolResult 结果对象
    - operator_info: 操作人信息，通常包含 userId / name / access
    """
    try:
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "operator": {
                "user_id": operator_info.get("userId") if operator_info else None,
                "name": operator_info.get("name") if operator_info else None,
                "role": operator_info.get("access") if operator_info else None,
            },
            "tool_name": tool_name,
            "args": args,
            "result": {
                "success": result.success,
                "message": result.message,
                # data 可能很大，只记录摘要或省略
                "data_summary": _summarize_data(result.data),
            },
            "environment": settings.app_env,
        }

        path = _get_log_path()
        _ensure_dir(path)
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        logger.exception("写操作审计日志记录失败，不影响主流程")


def _summarize_data(data: Any) -> Any:
    """对结果数据做简单摘要，避免日志过大。"""
    if data is None:
        return None
    if isinstance(data, dict):
        # 保留关键字段，最多 10 个键
        return {k: data[k] for k in list(data.keys())[:10]}
    if isinstance(data, list):
        return f"<list:{len(data)}>"
    return str(data)[:200]
