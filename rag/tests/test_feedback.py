"""
Tests for feedback endpoint.
"""

import pytest
import os
import tempfile

os.environ["GROQ_API_KEY"] = "test-groq-key"
os.environ["CHROMA_PERSIST_DIRECTORY"] = tempfile.mkdtemp()
os.environ["DOCUMENTS_DIRECTORY"] = tempfile.mkdtemp()


class TestFeedbackEndpoint:
    """Test cases for feedback endpoint."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from rag.app.main import app
        return TestClient(app)

    def test_feedback_thumbs_up(self, client):
        """Test submitting thumbs up feedback."""
        response = client.post("/feedback", json={
            "question": "What is PM-KISAN?",
            "answer": "PM-KISAN is a government scheme.",
            "tool_used": "rag",
            "rating": 1,
            "session_id": "test_session",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "thumbs up" in data["message"].lower()

    def test_feedback_thumbs_down(self, client):
        """Test submitting thumbs down feedback."""
        response = client.post("/feedback", json={
            "question": "Test question",
            "answer": "Test answer",
            "tool_used": "rag",
            "rating": 0,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_feedback_invalid_rating(self, client):
        """Test feedback with invalid rating."""
        response = client.post("/feedback", json={
            "question": "Test",
            "answer": "Test",
            "tool_used": "rag",
            "rating": 2,
        })

        assert response.status_code == 400

    def test_feedback_summary(self, client):
        """Test getting feedback summary."""
        # Submit some feedback first
        client.post("/feedback", json={
            "question": "Q1",
            "answer": "A1",
            "tool_used": "rag",
            "rating": 1,
        })
        client.post("/feedback", json={
            "question": "Q2",
            "answer": "A2",
            "tool_used": "crop_prediction",
            "rating": 0,
        })

        response = client.get("/feedback/summary")
        assert response.status_code == 200

        data = response.json()
        assert "total" in data
        assert "thumbs_up" in data
        assert "thumbs_down" in data
        assert "satisfaction_rate" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])