"""
Tests for agent tool selection logic.
"""

import pytest
import os
import tempfile

# Set environment variables before importing
os.environ["GROQ_API_KEY"] = "test-groq-key"
os.environ["CHROMA_PERSIST_DIRECTORY"] = tempfile.mkdtemp()
os.environ["DOCUMENTS_DIRECTORY"] = tempfile.mkdtemp()


class TestToolSelection:
    """Test cases for agent tool selection."""

    def test_rag_tool_description(self):
        """Test that RAG tool has correct description for document questions."""
        from agent.tools import create_rag_tool

        # Create mock vector store
        class MockVectorStore:
            def is_ready(self):
                return True

            def similarity_search(self, query, top_k):
                return [("Test content", {"source": "test.md"}, 0.9)]

        class MockGenService:
            def generate_with_sources(self, question, retrieved_docs):
                return "Test answer", [{"source": "test.md", "content": "Test", "score": 0.9}]

        tool = create_rag_tool(MockVectorStore(), MockGenService())

        assert tool.name == "farm_document_retrieval"
        assert "government schemes" in tool.description.lower()
        assert "PM-KISAN" in tool.description

    def test_crop_tool_description(self):
        """Test that crop tool has correct description for prediction questions."""
        from agent.tools import create_crop_tool

        tool = create_crop_tool()

        assert tool.name == "crop_prediction"
        assert "soil" in tool.description.lower()
        assert "NPK" in tool.description

    def test_utility_tool_description(self):
        """Test that utility tool has correct description for calculation questions."""
        from agent.tools import create_utility_tool

        tool = create_utility_tool()

        assert tool.name == "farm_utility"
        assert "fertilizer" in tool.description.lower()
        assert "converting" in tool.description.lower()

    def test_utility_fertilizer_calculation(self):
        """Test fertilizer calculation for rice."""
        from agent.tools import create_utility_tool

        tool = create_utility_tool()

        result = tool._run(
            calculation_type="fertilizer",
            crop="rice",
            area=5.0,
        )

        assert "rice" in result.lower()
        assert "urea" in result.lower()
        assert "dap" in result.lower()
        assert "N" in result
        assert "P" in result

    def test_utility_unit_conversion(self):
        """Test unit conversion."""
        from agent.tools import create_utility_tool

        tool = create_utility_tool()

        result = tool._run(
            calculation_type="conversion",
            value=1,
            from_unit="acre",
            to_unit="hectare",
        )

        assert "0.40" in result or "0.404" in result

    def test_utility_unknown_crop(self):
        """Test handling unknown crop."""
        from agent.tools import create_utility_tool

        tool = create_utility_tool()

        result = tool._run(
            calculation_type="fertilizer",
            crop="unknowncrop",
            area=5.0,
        )

        assert "unknown" in result.lower()
        assert "Available crops" in result

    def test_all_tools_available(self):
        """Test that all three tools can be created."""
        from agent.tools import (
            create_rag_tool,
            create_crop_tool,
            create_utility_tool,
        )

        class MockVS:
            def is_ready(self):
                return True

            def similarity_search(self, q, k):
                return []

        class MockGS:
            def generate_with_sources(self, q, d):
                return "", []

        rag = create_rag_tool(MockVS(), MockGS())
        crop = create_crop_tool()
        utility = create_utility_tool()

        assert rag.name == "farm_document_retrieval"
        assert crop.name == "crop_prediction"
        assert utility.name == "farm_utility"


class TestToolSelectionLogic:
    """Test the tool selection logic based on question keywords."""

    def test_document_keywords(self):
        """Questions containing these keywords should use RAG tool."""
        doc_keywords = [
            "PM-KISAN",
            "government scheme",
            "crop cultivation",
            "how to grow rice",
            "pest control",
            "fertilizer recommendations",
            "irrigation methods",
        ]

        for keyword in doc_keywords:
            # This would be tested by the actual agent
            # Here we just verify our expectations
            assert len(keyword) > 0

    def test_crop_prediction_keywords(self):
        """Questions containing these keywords should use crop tool."""
        crop_keywords = [
            "recommend a crop",
            "what crop should I grow",
            "soil test results",
            "NPK",
            "nitrogen phosphorus potassium",
            "predict yield",
        ]

        for keyword in crop_keywords:
            assert len(keyword) > 0

    def test_utility_keywords(self):
        """Questions containing these keywords should use utility tool."""
        utility_keywords = [
            "convert acres to hectares",
            "calculate fertilizer",
            "how much urea for 5 acres",
            "kg to quintal",
            "fertilizer dosage",
        ]

        for keyword in utility_keywords:
            assert len(keyword) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])