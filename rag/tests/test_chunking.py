"""
Tests for document chunking service.
"""

import pytest
import tempfile
from pathlib import Path
from rag.services.ingestion import DocumentIngestionService


class TestDocumentChunking:
    """Test cases for document chunking."""

    @pytest.fixture
    def ingestion_service(self):
        """Create an ingestion service with small chunk size for testing."""
        return DocumentIngestionService(chunk_size=100, chunk_overlap=20)

    @pytest.fixture
    def sample_text_file(self):
        """Create a temporary text file with sample content."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a test document.\n\nIt has multiple paragraphs.\n\nEach paragraph should be chunked separately.")
            temp_path = f.name
        yield temp_path
        Path(temp_path).unlink(missing_ok=True)

    @pytest.fixture
    def sample_markdown_file(self):
        """Create a temporary markdown file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
            f.write("# Farming Guide\n\n## Crop Selection\n\nChoose crops based on soil type.")
            temp_path = f.name
        yield temp_path
        Path(temp_path).unlink(missing_ok=True)

    def test_chunk_text_file(self, ingestion_service, sample_text_file):
        """Test chunking a text file."""
        documents = ingestion_service.load_document(sample_text_file)
        assert len(documents) > 0

        chunks = ingestion_service.chunk_documents(documents)
        assert len(chunks) > 0

        # Verify chunk content
        chunk_texts = [chunk[0] for chunk in chunks]
        assert any("test document" in text.lower() for text in chunk_texts)

    def test_chunk_markdown_file(self, ingestion_service, sample_markdown_file):
        """Test chunking a markdown file."""
        documents = ingestion_service.load_document(sample_markdown_file)
        assert len(documents) > 0

        chunks = ingestion_service.chunk_documents(documents)
        assert len(chunks) > 0

    def test_chunk_empty_documents(self, ingestion_service):
        """Test chunking with empty document list."""
        chunks = ingestion_service.chunk_documents([])
        assert chunks == []

    def test_load_directory(self, ingestion_service):
        """Test loading multiple documents from a directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create test files
            for i in range(3):
                file_path = Path(temp_dir) / f"test_{i}.txt"
                file_path.write_text(f"Document {i} content.")

            documents = ingestion_service.load_directory(temp_dir)
            assert len(documents) == 3

    def test_chunk_size_respected(self, ingestion_service):
        """Test that chunk sizes are respected."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            # Write content longer than chunk_size
            f.write("A" * 500)
            temp_path = f.name

        try:
            documents = ingestion_service.load_document(temp_path)
            chunks = ingestion_service.chunk_documents(documents)

            # Most chunks should be under the chunk_size
            for chunk_text, _ in chunks:
                assert len(chunk_text) <= 150  # Allow some flexibility
        finally:
            Path(temp_path).unlink(missing_ok=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])