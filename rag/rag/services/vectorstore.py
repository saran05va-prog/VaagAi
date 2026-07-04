"""
Vector Store Service
Manages Chroma vector database for document storage and retrieval.
"""

import logging
from pathlib import Path
from typing import List, Tuple, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing Chroma vector database."""

    def __init__(
        self,
        persist_directory: str,
        embedding_service,
        collection_name: str = "farm_documents",
    ):
        """
        Initialize the vector store service.

        Args:
            persist_directory: Directory to persist Chroma database
            embedding_service: Embedding service instance
            collection_name: Name of the Chroma collection
        """
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.collection_name = collection_name
        self.embedding_service = embedding_service

        # Initialize Chroma client
        self.client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "Farm advisory documents"},
        )

        logger.info(f"Vector store initialized: {collection_name}")
        logger.info(f"Documents in store: {self.collection.count()}")

    def add_documents(self, chunks: List[Tuple[str, dict]]) -> int:
        """
        Add chunked documents to the vector store.

        Args:
            chunks: List of tuples (text, metadata)

        Returns:
            Number of documents added
        """
        if not chunks:
            return 0

        texts = [chunk[0] for chunk in chunks]
        metadatas = [chunk[1] for chunk in chunks]
        ids = [f"doc_{i}_{hash(text) % 100000}" for i, text in enumerate(texts)]

        # Generate embeddings
        embeddings = self.embedding_service.embed_documents(texts)

        # Add to Chroma
        self.collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        logger.info(f"Added {len(chunks)} documents to vector store")
        return len(chunks)

    def similarity_search(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Tuple[str, dict, float]]:
        """
        Search for similar documents.

        Args:
            query: Query text
            top_k: Number of results to return

        Returns:
            List of tuples (text, metadata, score)
        """
        # Generate query embedding
        query_embedding = self.embedding_service.embed_query(query)

        # Search in Chroma
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
        )

        # Parse results
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        # Convert distances to similarity scores (lower distance = higher similarity)
        results_list = []
        for doc, meta, dist in zip(documents, metadatas, distances):
            score = 1.0 - dist  # Convert distance to similarity
            results_list.append((doc, meta or {}, score))

        logger.info(f"Retrieved {len(results_list)} documents for query")
        return results_list

    def delete_collection(self) -> None:
        """Delete the entire collection."""
        self.client.delete_collection(name=self.collection_name)
        logger.info(f"Deleted collection: {self.collection_name}")

    def get_document_count(self) -> int:
        """Get the number of documents in the store."""
        return self.collection.count()

    def is_ready(self) -> bool:
        """Check if the vector store is ready (has documents)."""
        return self.collection.count() > 0


def create_vector_store_service(
    persist_directory: str,
    embedding_service,
    collection_name: str = "farm_documents",
) -> VectorStoreService:
    """Factory function to create a vector store service."""
    return VectorStoreService(
        persist_directory=persist_directory,
        embedding_service=embedding_service,
        collection_name=collection_name,
    )