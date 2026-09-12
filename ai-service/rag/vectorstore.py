"""Chroma 向量库封装（HTTP 客户端模式）。

实际检索优先走 core.rag_engine（统一入口），本模块提供更底层的集合管理。
"""
from __future__ import annotations

import logging
from typing import Optional

import chromadb

from config import settings

logger = logging.getLogger(__name__)

_client: Optional[chromadb.HttpClient] = None


def get_vectorstore() -> Optional[chromadb.HttpClient]:
    """单例获取 Chroma HTTP 客户端。"""
    global _client
    if _client is not None:
        return _client
    try:
        host = "localhost"
        port = 8001
        if "://" in settings.chroma_base_url:
            parts = settings.chroma_base_url.split("://")[1].split(":")
            host = parts[0]
            if len(parts) > 1:
                port = int(parts[1])
        _client = chromadb.HttpClient(host=host, port=port)
        logger.info("Chroma connected at %s:%s", host, port)
        return _client
    except Exception as e:
        logger.warning("Chroma unavailable: %s", e)
        return None
