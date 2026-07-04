"""
Generation Service
Generates answers using LangChain with Groq LLM.
"""

import logging
from typing import List, Tuple
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

logger = logging.getLogger(__name__)

# Default prompt template for farm advisory
FARM_ADVISORY_PROMPT = """You are a helpful farming advisory assistant. Use the following context from agricultural documents to answer the question. If you cannot find the answer in the context, say so clearly.

Context:
{context}

Question: {question}

Answer:"""


class GenerationService:
    """Service for generating answers using LLM."""

    def __init__(
        self,
        groq_api_key: str,
        model_name: str = "llama-3-70b-versatile",
        temperature: float = 0.3,
    ):
        """
        Initialize the generation service.

        Args:
            groq_api_key: Groq API key
            model_name: Groq model to use
            temperature: Sampling temperature (0-1)
        """
        self.model_name = model_name

        # Initialize Groq LLM
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model=model_name,
            temperature=temperature,
            max_tokens=1024,
        )

        # Create prompt template
        self.prompt_template = PromptTemplate(
            template=FARM_ADVISORY_PROMPT,
            input_variables=["context", "question"],
        )

        logger.info(f"Generation service initialized with model: {model_name}")

    def generate_answer(
        self,
        question: str,
        retrieved_docs: List[Tuple[str, dict, float]],
    ) -> str:
        """
        Generate an answer from question and retrieved documents.

        Args:
            question: User question
            retrieved_docs: List of (text, metadata, score) tuples

        Returns:
            Generated answer string
        """
        if not retrieved_docs:
            return "I don't have enough information to answer that question. Please try rephrasing or adding more context."

        # Build context from retrieved documents
        context_parts = []
        for doc_text, meta, score in retrieved_docs:
            source = meta.get("source", "Unknown")
            context_parts.append(f"[Source: {source}]\n{doc_text}")

        context = "\n\n".join(context_parts)

        # Format prompt
        prompt = self.prompt_template.format(
            context=context,
            question=question,
        )

        # Generate answer
        try:
            response = self.llm.invoke(prompt)
            answer = response.content if hasattr(response, "content") else str(response)
            logger.info(f"Generated answer for question: {question[:50]}...")
            return answer
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return f"I encountered an error generating the answer: {str(e)}"

    def generate_with_sources(
        self,
        question: str,
        retrieved_docs: List[Tuple[str, dict, float]],
    ) -> Tuple[str, List[dict]]:
        """
        Generate answer with source citations.

        Args:
            question: User question
            retrieved_docs: List of (text, metadata, score) tuples

        Returns:
            Tuple of (answer, sources_list)
        """
        answer = self.generate_answer(question, retrieved_docs)

        # Build sources list
        sources = []
        for doc_text, meta, score in retrieved_docs[:5]:
            sources.append({
                "source": meta.get("source", "Unknown"),
                "content": doc_text[:200] + "..." if len(doc_text) > 200 else doc_text,
                "score": round(score, 3),
            })

        return answer, sources


def create_generation_service(
    groq_api_key: str,
    model_name: str = "llama-3-70b-versatile",
    temperature: float = 0.3,
) -> GenerationService:
    """Factory function to create a generation service."""
    return GenerationService(
        groq_api_key=groq_api_key,
        model_name=model_name,
        temperature=temperature,
    )