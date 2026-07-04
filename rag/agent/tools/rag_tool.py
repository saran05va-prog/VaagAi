"""
RAG Tool
Retrieves relevant information from farm advisory documents.
"""

import logging
from typing import Optional, Any
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun

logger = logging.getLogger(__name__)


class RAGInput(BaseModel):
    """Input schema for RAG tool."""
    question: str = Field(description="The farming question to answer")


class RAGToolResult(BaseModel):
    """Result from RAG tool."""
    answer: str
    sources: list[dict]
    tool_used: str = "rag"


class RAGTool(BaseTool):
    """Tool for retrieving information from farm advisory documents."""

    name: str = "farm_document_retrieval"
    description: str = (
        "Useful for answering questions about government schemes (PM-KISAN, Kisan Credit Card, crop insurance), "
        "crop cultivation practices (rice, wheat, maize, vegetables), pest management, fertilizer application, "
        "irrigation methods, and general farming best practices. Use this when the user asks about agricultural "
        "information that can be found in documents."
    )
    args_schema: type[BaseModel] = RAGInput
    vector_store: Any = None
    generation_service: Any = None
    top_k: int = 5

    def __init__(self, vector_store, generation_service, top_k: int = 5, **kwargs):
        super().__init__(vector_store=vector_store, generation_service=generation_service, top_k=top_k, **kwargs)

    def _run(
        self,
        question: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Execute the RAG tool."""
        try:
            # Check if documents are loaded
            if not self.vector_store.is_ready():
                return "No documents loaded. Please ingest documents first."

            # Retrieve relevant documents
            retrieved_docs = self.vector_store.similarity_search(
                query=question,
                top_k=self.top_k,
            )

            if not retrieved_docs:
                return "I couldn't find relevant information in the documents."

            # Generate answer with sources
            answer, sources = self.generation_service.generate_with_sources(
                question=question,
                retrieved_docs=retrieved_docs,
            )

            # Format the response
            response = f"Answer: {answer}\n\nSources:\n"
            for src in sources:
                response += f"- {src['source']} (relevance: {src['score']:.2f})\n"

            return response

        except Exception as e:
            logger.error(f"RAG tool error: {e}")
            return f"Error retrieving information: {str(e)}"


def create_rag_tool(vector_store, generation_service, top_k: int = 5) -> RAGTool:
    """Factory function to create RAG tool."""
    return RAGTool(
        vector_store=vector_store,
        generation_service=generation_service,
        top_k=top_k,
    )