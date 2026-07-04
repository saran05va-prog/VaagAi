"""
Script to ingest sample documents into vector collections.
Run: python scripts/ingest_documents.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from rag.config import settings
from rag.services.ingestion import create_ingestion_service
from rag.services.embedding import create_embedding_service
from rag.services.vectorstore import create_vector_store_service


def ingest_agriculture_documents():
    """Ingest agriculture documents."""
    print("=" * 50)
    print("Ingesting Agriculture Documents")
    print("=" * 50)

    # Initialize services
    embedding_service = create_embedding_service(
        model_name=settings.embedding_model,
    )

    vector_store = create_vector_store_service(
        persist_directory="./data/chroma_agriculture",
        embedding_service=embedding_service,
        collection_name="agriculture",
    )

    ingestion_service = create_ingestion_service(
        chunk_size=600,
        chunk_overlap=80,
    )

    # Load documents
    docs_dir = Path(__file__).parent.parent / "data" / "documents"
    agriculture_files = [
        docs_dir / "agriculture_crops.md",
        docs_dir / "government_schemes.md",
    ]

    all_chunks = []

    for file_path in agriculture_files:
        if file_path.exists():
            print(f"Loading: {file_path.name}")
            docs = ingestion_service.load_document(str(file_path))
            chunks = ingestion_service.chunk_documents(docs)

            # Add metadata
            chunks_with_meta = [
                (text, {"source": file_path.name, "category": "agriculture"})
                for text, meta in chunks
            ]
            all_chunks.extend(chunks_with_meta)
            print(f"  Created {len(chunks)} chunks")
        else:
            print(f"File not found: {file_path}")

    if all_chunks:
        chunks_added = vector_store.add_documents(all_chunks)
        print(f"\nTotal chunks added: {chunks_added}")
    else:
        print("\nNo chunks to add")

    return vector_store.get_document_count()


def ingest_company_documents():
    """Ingest company documents."""
    print("=" * 50)
    print("Ingesting Company Documents")
    print("=" * 50)

    # Initialize services
    embedding_service = create_embedding_service(
        model_name=settings.embedding_model,
    )

    vector_store = create_vector_store_service(
        persist_directory="./data/chroma_company",
        embedding_service=embedding_service,
        collection_name="company",
    )

    ingestion_service = create_ingestion_service(
        chunk_size=400,
        chunk_overlap=50,
    )

    # Load documents
    docs_dir = Path(__file__).parent.parent / "data" / "documents"
    company_files = [
        docs_dir / "company_info.md",
    ]

    all_chunks = []

    for file_path in company_files:
        if file_path.exists():
            print(f"Loading: {file_path.name}")
            docs = ingestion_service.load_document(str(file_path))
            chunks = ingestion_service.chunk_documents(docs)

            # Add metadata
            chunks_with_meta = [
                (text, {"source": file_path.name, "category": "company"})
                for text, meta in chunks
            ]
            all_chunks.extend(chunks_with_meta)
            print(f"  Created {len(chunks)} chunks")
        else:
            print(f"File not found: {file_path}")

    if all_chunks:
        chunks_added = vector_store.add_documents(all_chunks)
        print(f"\nTotal chunks added: {chunks_added}")
    else:
        print("\nNo chunks to add")

    return vector_store.get_document_count()


def main():
    """Main function to ingest all documents."""
    print("Starting document ingestion...")
    print(f"Documents directory: {Path(__file__).parent.parent / 'data' / 'documents'}")
    print()

    # Check for API key
    if not settings.groq_api_key:
        print("WARNING: GROQ_API_KEY not set in environment")
        print("Using default embedding model")

    # Ingest documents
    agri_count = ingest_agriculture_documents()
    print()
    company_count = ingest_company_documents()

    print()
    print("=" * 50)
    print("Ingestion Complete!")
    print("=" * 50)
    print(f"Agriculture collection: {agri_count} documents")
    print(f"Company collection: {company_count} documents")
    print(f"Total: {agri_count + company_count} documents")


if __name__ == "__main__":
    main()