"""
Tests for embedding service.
"""

import pytest
from rag.services.embedding import EmbeddingService


class TestEmbeddingService:
    """Test cases for embedding service."""

    @pytest.fixture
    def embedding_service(self):
        """Create an embedding service."""
        return EmbeddingService(model_name="all-MiniLM-L6-v2")

    def test_embed_single_document(self, embedding_service):
        """Test embedding a single document."""
        text = "Crop recommendation based on soil health"
        embedding = embedding_service.embed_query(text)

        assert isinstance(embedding, list)
        assert len(embedding) == 384  # all-MiniLM-L6-v2 produces 384-dim vectors
        assert all(isinstance(x, float) for x in embedding)

    def test_embed_multiple_documents(self, embedding_service):
        """Test embedding multiple documents."""
        texts = [
            "Rice cultivation in monsoon season",
            "Wheat farming techniques",
            "Organic fertilizer application",
        ]
        embeddings = embedding_service.embed_documents(texts)

        assert len(embeddings) == 3
        assert all(len(emb) == 384 for emb in embeddings)

    def test_embed_query(self, embedding_service):
        """Test embedding a query."""
        query = "What crops grow best in clay soil?"
        embedding = embedding_service.embed_query(query)

        assert isinstance(embedding, list)
        assert len(embedding) == 384

    def test_similar_texts_have_similar_embeddings(self, embedding_service):
        """Test that similar texts produce similar embeddings."""
        text1 = "How to plant rice paddy"
        text2 = "Rice paddy planting methods"

        emb1 = embedding_service.embed_query(text1)
        emb2 = embedding_service.embed_query(text2)

        # Calculate cosine similarity
        from numpy import dot
        from numpy.linalg import norm

        cos_sim = dot(emb1, emb2) / (norm(emb1) * norm(emb2))

        # Similar texts should have high similarity (typically > 0.7)
        assert cos_sim > 0.5

    def test_different_texts_have_different_embeddings(self, embedding_service):
        """Test that different texts produce different embeddings."""
        text1 = "Rice farming techniques"
        text2 = "Weather forecast for tomorrow"

        emb1 = embedding_service.embed_query(text1)
        emb2 = embedding_service.embed_query(text2)

        from numpy import dot
        from numpy.linalg import norm

        cos_sim = dot(emb1, emb2) / (norm(emb1) * norm(emb2))

        # Different texts should have lower similarity
        assert cos_sim < 0.9

    def test_empty_text_handling(self, embedding_service):
        """Test handling empty text."""
        embedding = embedding_service.embed_query("")
        assert isinstance(embedding, list)
        assert len(embedding) == 384

    def test_get_embedding_dimension(self, embedding_service):
        """Test getting embedding dimension."""
        dimension = embedding_service.get_embedding_dimension()
        assert dimension == 384


if __name__ == "__main__":
    pytest.main([__file__, "-v"])