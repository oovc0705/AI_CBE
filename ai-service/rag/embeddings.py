"""Embedding 封装。

优先使用 sentence-transformers 加载 BGE-m3（本地无依赖、多语言、跨境友好）。
若不可用，回退到 LiteLLM 路由（走云端 embedding API）。
"""
from __future__ import annotations

import logging
from typing import List, Optional

from config import settings

logger = logging.getLogger(__name__)

_embedder = None


class LocalBGEEmbedder:
    """基于 sentence-transformers 的 BGE-m3 本地 embedding。"""

    def __init__(self, model_name: str = "BAAI/bge-m3") -> None:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading embedding model %s ...", model_name)
        self.model = SentenceTransformer(model_name)

    def encode(self, texts: List[str]) -> List[List[float]]:
        vecs = self.model.encode(texts, normalize_embeddings=True)
        return vecs.tolist()


def get_embedder():
    """单例获取本地 embedder。若库未安装返回 None（上层回退到 LiteLLM）。"""
    global _embedder
    if _embedder is not None:
        return _embedder
    try:
        _embedder = LocalBGEEmbedder(settings.models.embedding)
        return _embedder
    except Exception as e:
        logger.warning("Local embedder unavailable (%s); will fallback to LiteLLM", e)
        return None
