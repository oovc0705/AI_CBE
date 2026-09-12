"""RAG（检索增强生成）引擎：向量检索 + 上下文注入。

用途：
- Admin Copilot：检索商品资料、运营 SOP、历史运营决策，给模型补充背景。
- 客服：检索 FAQ、退货政策、物流时效。

组件：
- Embedding：BGE-m3（多语言，契合跨境）。
- 向量库：Chroma（本地 HTTP 服务）。
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from config import settings
from core.model_router import model_router

logger = logging.getLogger(__name__)


class RAGEngine:
    """向量检索封装。当前为骨架，包含完整接口签名 + 兜底实现。

    上线前需要：
    1. 启动 Chroma（docker compose 已含）。
    2. 运行 `rag/ingest.py` 把业务文档/商品入库。
    """

    def __init__(self) -> None:
        self._chroma_client = None
        self._collections: Dict[str, Any] = {}

    def _get_client(self):
        """懒加载 Chroma 客户端。本地测试若无 Chroma，相关调用会被 try/except 兜底。"""
        if self._chroma_client is None:
            try:
                import chromadb
                self._chroma_client = chromadb.HttpClient(
                    host=settings.chroma_base_url.split("://")[1].split(":")[0]
                    if "://" in settings.chroma_base_url
                    else "localhost",
                    port=int(settings.chroma_base_url.rsplit(":", 1)[1])
                    if ":" in settings.chroma_base_url else 8001,
                )
            except Exception:
                logger.warning("Chroma unavailable, RAG will be no-op")
        return self._chroma_client

    def _get_collection(self, name: str):
        client = self._get_client()
        if client is None or name in self._collections:
            return self._collections.get(name)
        try:
            self._collections[name] = client.get_or_create_collection(name=name)
            return self._collections[name]
        except Exception:
            logger.exception("Failed to init collection %s", name)
            return None

    # ------------------------------------------------------------------
    async def embed(self, text: str) -> List[float]:
        """生成文本向量。"""
        return await model_router.embed(text)

    async def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> int:
        """批量入库文档。返回成功写入的条数。"""
        coll = self._get_collection(collection_name)
        if coll is None or not documents:
            return 0
        try:
            embeddings = [await self.embed(doc) for doc in documents]
            coll.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas or [{} for _ in documents],
                ids=ids or [f"doc_{i}" for i in range(len(documents))],
            )
            logger.info("RAG ingested %d docs into %s", len(documents), collection_name)
            return len(documents)
        except Exception:
            logger.exception("RAG ingest failed")
            return 0

    async def search(
        self,
        collection_name: str,
        query: str,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """检索与 query 最相关的 top_k 条文档。

        返回格式：[{"content": str, "metadata": dict, "score": float}]
        """
        coll = self._get_collection(collection_name)
        if coll is None:
            return []
        try:
            query_emb = await self.embed(query)
            result = coll.query(query_embeddings=[query_emb], n_results=top_k)
            docs = result.get("documents", [[]])[0]
            metas = result.get("metadatas", [[]])[0]
            distances = result.get("distances", [[]])[0]
            return [
                {
                    "content": doc,
                    "metadata": meta,
                    "score": float(dist),
                }
                for doc, meta, dist in zip(docs, metas, distances)
            ]
        except Exception:
            logger.exception("RAG search failed")
            return []

    async def build_context(self, collection_name: str, query: str, top_k: int = 4) -> str:
        """检索并把结果拼成可直接塞进 prompt 的上下文字符串。"""
        hits = await self.search(collection_name, query, top_k=top_k)
        if not hits:
            return ""
        blocks = []
        for i, hit in enumerate(hits, 1):
            blocks.append(f"[{i}] {hit['content']}")
        return "\n\n".join(blocks)


# 模块级单例
rag_engine = RAGEngine()
