"""
Embedding Service
Generates embeddings using sentence-transformers (all-MiniLM-L6-v2).
"""

import logging
from typing import List
from langchain_community.embeddings import SentenceTransformerEmbeddings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating document and query embeddings."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service.

        Args:
            model_name: Name of the sentence-transformers model
        """
        self.model_name = model_name
        logger.info(f"Loading embedding model: {model_name}")
        self.embeddings = SentenceTransformerEmbeddings(model_name=model_name)
        logger.info(f"Embedding model loaded: {model_name}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of documents.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        logger.debug(f"Embedding {len(texts)} documents")
        return self.embeddings.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        """
        Generate embedding for a single query.

        Args:
            text: Query text to embed

        Returns:
            Embedding vector
        """
        logger.debug(f"Embedding query: {text[:50]}...")
        return self.embeddings.embed_query(text)

    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embedding vectors."""
        # all-MiniLM-L6-v2 produces 384-dimensional vectors
        return 384


def create_embedding_service(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingService:
    """Factory function to create an embedding service."""
    return EmbeddingService(model_name=model_name)