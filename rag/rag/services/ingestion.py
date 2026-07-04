"""
Document Ingestion Service
Loads PDFs and markdown files, chunks them, and returns text segments.
"""

import logging
from pathlib import Path
from typing import List, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
)

logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """Service for loading and chunking documents."""

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Initialize the ingestion service.

        Args:
            chunk_size: Maximum characters per chunk
            chunk_overlap: Number of overlapping characters between chunks
        """
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )

    def load_document(self, file_path: str) -> List:
        """
        Load a single document (PDF, markdown, or text).

        Args:
            file_path: Path to the document

        Returns:
            List of LangChain Document objects
        """
        path = Path(file_path)
        suffix = path.suffix.lower()

        logger.info(f"Loading document: {file_path}")

        if suffix == ".pdf":
            loader = PyPDFLoader(file_path)
        elif suffix == ".md" or suffix == ".markdown":
            loader = TextLoader(file_path, encoding="utf-8")
        elif suffix == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            logger.warning(f"Unsupported file type: {suffix}")
            return []

        return loader.load()

    def load_directory(self, directory: str) -> List:
        """
        Load all supported documents from a directory.

        Args:
            directory: Path to directory containing documents

        Returns:
            List of LangChain Document objects
        """
        documents = []
        dir_path = Path(directory)

        if not dir_path.exists():
            logger.warning(f"Directory does not exist: {directory}")
            return documents

        supported_extensions = [".pdf", ".md", ".markdown", ".txt"]

        for ext in supported_extensions:
            for file_path in dir_path.rglob(f"*{ext}"):
                try:
                    docs = self.load_document(str(file_path))
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error loading {file_path}: {e}")

        logger.info(f"Loaded {len(documents)} documents from {directory}")
        return documents

    def chunk_documents(self, documents: List) -> List[Tuple[str, dict]]:
        """
        Chunk documents into smaller segments.

        Args:
            documents: List of LangChain Document objects

        Returns:
            List of tuples (chunk_text, metadata_dict)
        """
        if not documents:
            return []

        chunks = self.text_splitter.split_documents(documents)

        result = []
        for chunk in chunks:
            result.append((chunk.page_content, chunk.metadata))

        logger.info(f"Created {len(result)} chunks from {len(documents)} documents")
        return result


def create_ingestion_service(chunk_size: int = 500, chunk_overlap: int = 50) -> DocumentIngestionService:
    """Factory function to create an ingestion service."""
    return DocumentIngestionService(chunk_size=chunk_size, chunk_overlap=chunk_overlap)