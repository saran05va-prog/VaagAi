"""
Multi-Collection Vector Retriever
Enhanced retrieval from multiple knowledge collections.
"""

import logging
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    """A retrieved document chunk with metadata."""
    text: str
    metadata: Dict
    score: float
    collection: str
    rank: int = 0


@dataclass
class RetrievalResult:
    """Result from vector retrieval."""
    chunks: List[RetrievedChunk]
    total_chunks: int
    collection_sources: Dict[str, int]
    avg_score: float
    max_score: float


class VectorRetriever:
    """Retrieves documents from multiple vector collections."""

    def __init__(
        self,
        collections_config: List[Dict],
        embedding_service=None,
    ):
        """
        Initialize the vector retriever.

        Args:
            collections_config: List of collection configurations
            embedding_service: Embedding service instance
        """
        self.collections: Dict[str, any] = {}
        self.collections_config = collections_config
        self.embedding_service = embedding_service
        self._lock = threading.Lock()

    def initialize(self):
        """Initialize all configured collections."""
        from rag.services.vectorstore import create_vector_store_service

        for coll_config in self.collections_config:
            name = coll_config["name"]
            try:
                vector_store = create_vector_store_service(
                    persist_directory=coll_config["persist_directory"],
                    embedding_service=self.embedding_service,
                    collection_name=name,
                )
                self.collections[name] = {
                    "service": vector_store,
                    "config": coll_config,
                }
                logger.info(f"Loaded collection: {name} ({vector_store.get_document_count()} docs)")
            except Exception as e:
                logger.warning(f"Failed to load collection {name}: {e}")
                self.collections[name] = {
                    "service": None,
                    "config": coll_config,
                    "error": str(e),
                }

        logger.info(f"Initialized {len(self.collections)} vector collections")

    def retrieve(
        self,
        query: str,
        target_collections: List[str],
        top_k: int = 5,
        min_score: float = 0.3,
    ) -> RetrievalResult:
        """Retrieve documents from target collections."""
        all_chunks: List[RetrievedChunk] = []
        collection_sources: Dict[str, int] = {}

        def search_collection(collection_name: str) -> List[RetrievedChunk]:
            if collection_name not in self.collections:
                return []

            coll_data = self.collections[collection_name]
            vector_store = coll_data.get("service")

            if vector_store is None or not vector_store.is_ready():
                return []

            try:
                config = coll_data["config"]
                results = vector_store.similarity_search(
                    query=query,
                    top_k=top_k or config.get("top_k", 5),
                )

                chunks = []
                for rank, (text, meta, score) in enumerate(results):
                    if score >= min_score:
                        chunks.append(RetrievedChunk(
                            text=text,
                            metadata=meta,
                            score=score,
                            collection=collection_name,
                            rank=rank,
                        ))
                return chunks
            except Exception as e:
                logger.error(f"Error searching {collection_name}: {e}")
                return []

        with ThreadPoolExecutor(max_workers=len(target_collections)) as executor:
            futures = {
                executor.submit(search_collection, coll): coll
                for coll in target_collections
            }

            for future in as_completed(futures):
                coll_name = futures[future]
                try:
                    chunks = future.result()
                    with self._lock:
                        all_chunks.extend(chunks)
                        collection_sources[coll_name] = len(chunks)
                except Exception as e:
                    logger.error(f"Error in collection search {coll_name}: {e}")

        all_chunks.sort(key=lambda x: x.score, reverse=True)
        for i, chunk in enumerate(all_chunks):
            chunk.rank = i

        total_chunks = len(all_chunks)
        avg_score = sum(c.score for c in all_chunks) / total_chunks if total_chunks > 0 else 0
        max_score = all_chunks[0].score if all_chunks else 0

        return RetrievalResult(
            chunks=all_chunks[:top_k * len(target_collections)],
            total_chunks=total_chunks,
            collection_sources=collection_sources,
            avg_score=avg_score,
            max_score=max_score,
        )

    def get_collection_status(self) -> Dict[str, Dict]:
        """Get status of all collections."""
        status = {}
        for name, coll_data in self.collections.items():
            vector_store = coll_data.get("service")
            status[name] = {
                "ready": vector_store is not None and vector_store.is_ready(),
                "document_count": vector_store.get_document_count() if vector_store else 0,
                "error": coll_data.get("error"),
            }
        return status

    def add_documents(self, collection_name: str, chunks: List[Tuple[str, Dict]]) -> int:
        """Add documents to a specific collection."""
        if collection_name not in self.collections:
            raise ValueError(f"Collection {collection_name} not found")

        vector_store = self.collections[collection_name].get("service")
        if vector_store is None:
            raise ValueError(f"Collection {collection_name} not initialized")

        return vector_store.add_documents(chunks)

    def is_ready(self, collection_name: str = None) -> bool:
        """Check if collections are ready for retrieval."""
        if collection_name:
            coll = self.collections.get(collection_name)
            if coll:
                return coll.get("service") is not None and coll["service"].is_ready()
            return False

        return any(
            coll.get("service") is not None and coll["service"].is_ready()
            for coll in self.collections.values()
        )


def create_vector_retriever(collections_config: List[Dict], embedding_service=None) -> VectorRetriever:
    """Factory function to create a vector retriever."""
    retriever = VectorRetriever(collections_config, embedding_service)
    retriever.initialize()
    return retriever