"""
RAG Service Configuration
Enhanced for multi-collection support.
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List, Optional


class CollectionConfig(BaseSettings):
    """Configuration for a knowledge collection."""
    name: str
    description: str
    persist_directory: str
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k: int = 5


class Settings(BaseSettings):
    """RAG service settings loaded from environment."""

    # Groq API
    groq_api_key: str = ""

    # Embedding Model
    embedding_model: str = "all-MiniLM-L6-v2"

    # Ollama (optional local embeddings)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "nomic-embed-text"
    use_ollama: bool = False

    # Claude (Anthropic)
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-20250514"

    # MiniMax
    minimax_api_key: str = ""
    minimax_model: str = "abab6.5s-chat"

    # LLM Model (primary)
    llm_model: str = "llama-3-70b-versatile"

    # Chunking
    default_chunk_size: int = 500
    default_chunk_overlap: int = 50

    # Retrieval
    default_top_k: int = 5
    rerank_top_k: int = 3
    confidence_threshold: float = 0.7

    # Collections
    # Note: These are initialized in main.py based on this config

    # Market API (optional)
    market_api_url: str = ""
    market_api_key: str = ""

    # Safety
    allowed_domains: List[str] = [
        "agriculture",
        "farming",
        "crops",
        "weather",
        "market",
        "company",
        "policy",
        "app",
        "support",
    ]

    # Conversation memory
    max_history_length: int = 20
    memory_ttl_seconds: int = 3600

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


def get_documents_dir() -> Path:
    """Get the documents directory path."""
    return Path(__file__).parent / "data" / "documents"


def get_chroma_dir() -> Path:
    """Get the Chroma persistence directory."""
    return Path(__file__).parent / "data" / "chroma_db"


def get_all_collections() -> dict:
    """Get all collection configurations."""
    return {
        "agriculture": {
            "name": "agriculture",
            "description": "Agriculture knowledge - crops, diseases, fertilizers, weather, market, farming techniques, government schemes",
            "persist_directory": str(get_chroma_dir() / "agriculture"),
            "chunk_size": 600,
            "chunk_overlap": 80,
            "top_k": 5,
        },
        "company": {
            "name": "company",
            "description": "Company knowledge - about, mission, services, policies, FAQs, contact, app features",
            "persist_directory": str(get_chroma_dir() / "company"),
            "chunk_size": 400,
            "chunk_overlap": 50,
            "top_k": 3,
        },
    }