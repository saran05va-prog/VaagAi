"""
Tests for the /ask endpoint.
"""

import pytest
import os
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient

# Set environment variables before importing app
os.environ["GROQ_API_KEY"] = "test-groq-key"
os.environ["CHROMA_PERSIST_DIRECTORY"] = tempfile.mkdtemp()
os.environ["DOCUMENTS_DIRECTORY"] = tempfile.mkdtemp()


class TestAskEndpoint:
    """Test cases for the /ask FastAPI endpoint."""

    @pytest.fixture
    def client(self):
        """Create a test client."""
        from rag.app.main import app
        return TestClient(app)

    @pytest.fixture
    def sample_document(self):
        """Create a sample document for testing."""
        doc_dir = Path(os.environ["DOCUMENTS_DIRECTORY"])
        doc_path = doc_dir / "farming_guide.md"
        doc_path.write_text("""# Farming Guide

## Rice Cultivation
Rice requires flooded fields and grows well in clay soil.

## Wheat Cultivation
Wheat is a Rabi crop grown in cooler climates.

## Fertilizer Application
Use NPK fertilizers based on soil test results.
""")
        return str(doc_path)

    def test_health_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "ok"
        assert "embedding_model" in data
        assert "llm_model" in data

    def test_ask_without_documents(self, client):
        """Test asking a question without loaded documents."""
        response = client.post("/ask", json={"question": "How to grow rice?"})
        # Should return 503 because no documents loaded
        assert response.status_code == 503

    def test_ask_with_empty_question(self, client):
        """Test asking with empty question."""
        response = client.post("/ask", json={"question": ""})
        assert response.status_code == 422  # Validation error

    def test_ask_with_missing_question(self, client):
        """Test asking without question field."""
        response = client.post("/ask", json={})
        assert response.status_code == 422  # Validation error

    def test_document_count_empty(self, client):
        """Test getting document count when empty."""
        response = client.get("/documents/count")
        assert response.status_code == 200
        assert "count" in response.json()

    def test_ingest_endpoint_with_file(self, client, sample_document):
        """Test document ingestion."""
        response = client.post("/ingest", json={"file_path": sample_document})
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "success"
        assert data["documents_processed"] > 0
        assert data["chunks_created"] > 0

    def test_ingest_endpoint_with_directory(self, client):
        """Test directory ingestion."""
        temp_dir = tempfile.mkdtemp()
        doc_path = Path(temp_dir) / "test.md"
        doc_path.write_text("# Test Document\n\nTest content.")

        response = client.post("/ingest", json={"directory": temp_dir})
        assert response.status_code == 200

    def test_ingest_endpoint_without_file_or_directory(self, client):
        """Test ingestion without file or directory."""
        response = client.post("/ingest", json={})
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])