"""
Pytest configuration and shared fixtures for RAG tests.
"""

import os
import pytest
import tempfile
from pathlib import Path


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Set up test environment variables."""
    # Set required environment variables for testing
    os.environ.setdefault("GROQ_API_KEY", "test-groq-key-for-testing")
    os.environ.setdefault("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    os.environ.setdefault("LLM_MODEL", "llama-3-70b-versatile")
    os.environ.setdefault("CHUNK_SIZE", "500")
    os.environ.setdefault("CHUNK_OVERLAP", "50")
    os.environ.setdefault("TOP_K", "5")

    # Create temporary directories
    temp_chroma = tempfile.mkdtemp()
    temp_docs = tempfile.mkdtemp()

    os.environ.setdefault("CHROMA_PERSIST_DIRECTORY", temp_chroma)
    os.environ.setdefault("DOCUMENTS_DIRECTORY", temp_docs)

    yield

    # Cleanup is handled by tempfile


@pytest.fixture
def temp_chroma_dir():
    """Provide a temporary Chroma directory."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup handled by OS


@pytest.fixture
def temp_docs_dir():
    """Provide a temporary documents directory."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    # Cleanup handled by OS