"""Copilot 历史记录服务。

封装会话、消息、写操作审计的数据库写入与查询。
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import CopilotMessage, CopilotOperation, CopilotSession


async def ensure_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    title: str = "新对话",
) -> CopilotSession:
    """确保会话记录存在；不存在则创建，存在则更新 updated_at。"""
    result = await db.execute(
        select(CopilotSession).where(CopilotSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if session is None:
        session = CopilotSession(
            id=session_id,
            user_id=user_id,
            title=title[:255],
            created_at=now,
            updated_at=now,
        )
        db.add(session)
    else:
        session.updated_at = now
    await db.commit()
    await db.refresh(session)
    return session


async def save_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str,
    meta: Optional[Dict[str, Any]] = None,
) -> CopilotMessage:
    """保存一条消息。"""
    msg = CopilotMessage(
        session_id=session_id,
        role=role,
        content=content or "",
        meta=meta,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def save_operation(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    tool_name: str,
    args: Dict[str, Any],
    result: Any,
    success: bool,
) -> CopilotOperation:
    """保存一次写操作审计记录。"""
    op = CopilotOperation(
        session_id=session_id,
        user_id=user_id,
        tool_name=tool_name,
        args=args,
        result=result,
        success="success" if success else "failed",
    )
    db.add(op)
    await db.commit()
    await db.refresh(op)
    return op


async def list_sessions(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """列出用户的会话历史。"""
    result = await db.execute(
        select(CopilotSession)
        .where(CopilotSession.user_id == user_id)
        .order_by(desc(CopilotSession.updated_at))
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in sessions
    ]


async def list_messages(
    db: AsyncSession,
    session_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
    """列出某会话的消息（校验归属用户）。"""
    # 校验会话归属
    sess_result = await db.execute(
        select(CopilotSession).where(
            CopilotSession.id == session_id,
            CopilotSession.user_id == user_id,
        )
    )
    if sess_result.scalar_one_or_none() is None:
        return []

    result = await db.execute(
        select(CopilotMessage)
        .where(CopilotMessage.session_id == session_id)
        .order_by(CopilotMessage.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "meta": m.meta,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


async def list_operations(
    db: AsyncSession,
    user_id: str,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """列出用户的写操作历史。"""
    result = await db.execute(
        select(CopilotOperation)
        .where(CopilotOperation.user_id == user_id)
        .order_by(desc(CopilotOperation.created_at))
        .limit(limit)
        .offset(offset)
    )
    ops = result.scalars().all()
    return [
        {
            "id": o.id,
            "session_id": o.session_id,
            "tool_name": o.tool_name,
            "args": o.args,
            "result": o.result,
            "success": o.success,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in ops
    ]


async def count_all_sessions(db: AsyncSession) -> int:
    """管理员：统计所有会话数量。"""
    from sqlalchemy import func
    result = await db.execute(select(func.count()).select_from(CopilotSession))
    return result.scalar() or 0


async def list_all_sessions(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """管理员：列出所有用户的会话历史。"""
    result = await db.execute(
        select(CopilotSession)
        .order_by(desc(CopilotSession.updated_at))
        .limit(limit)
        .offset(offset)
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in sessions
    ]


async def list_all_messages(
    db: AsyncSession,
    session_id: str,
) -> List[Dict[str, Any]]:
    """管理员：列出某会话的全部消息（不校验归属用户）。"""
    result = await db.execute(
        select(CopilotMessage)
        .where(CopilotMessage.session_id == session_id)
        .order_by(CopilotMessage.created_at)
    )
    messages = result.scalars().all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "meta": m.meta,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


async def count_all_operations(db: AsyncSession, session_id: Optional[str] = None) -> int:
    """管理员：统计写操作记录数量。"""
    from sqlalchemy import func
    query = select(func.count()).select_from(CopilotOperation)
    if session_id:
        query = query.where(CopilotOperation.session_id == session_id)
    result = await db.execute(query)
    return result.scalar() or 0


async def list_all_operations(
    db: AsyncSession,
    session_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """管理员：列出所有用户的写操作历史。"""
    query = select(CopilotOperation)
    if session_id:
        query = query.where(CopilotOperation.session_id == session_id)
    result = await db.execute(
        query.order_by(desc(CopilotOperation.created_at))
        .limit(limit)
        .offset(offset)
    )
    ops = result.scalars().all()
    return [
        {
            "id": o.id,
            "session_id": o.session_id,
            "user_id": o.user_id,
            "tool_name": o.tool_name,
            "args": o.args,
            "result": o.result,
            "success": o.success,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in ops
    ]


async def delete_session(db: AsyncSession, session_id: str) -> bool:
    """管理员：删除会话及其消息、操作记录。"""
    session = await db.execute(
        select(CopilotSession).where(CopilotSession.id == session_id)
    )
    sess = session.scalar_one_or_none()
    if sess is None:
        return False
    await db.execute(
        CopilotMessage.__table__.delete().where(CopilotMessage.session_id == session_id)
    )
    await db.execute(
        CopilotOperation.__table__.delete().where(CopilotOperation.session_id == session_id)
    )
    await db.delete(sess)
    await db.commit()
    return True


def generate_title(user_message: str) -> str:
    """根据用户首条消息生成会话标题。"""
    text = (user_message or "").strip().replace("\n", " ")
    if len(text) <= 30:
        return text or "新对话"
    return text[:30] + "…"
