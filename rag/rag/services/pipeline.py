"""
RAG Pipeline Service
Main orchestration for the complete RAG system.
"""

import logging
import asyncio
from typing import Dict, List, Optional
from dataclasses import dataclass

from rag.services.intent_classifier import IntentClassifier, Intent, create_intent_classifier
from rag.services.retriever import VectorRetriever, RetrievalResult, create_vector_retriever
from rag.services.reranker import ReRanker, create_reranker
from rag.services.groq_fallback import GroqFallbackService, create_groq_fallback_service
from rag.services.action_generator import ActionGenerator, create_action_generator
from rag.services.conversation_memory import ConversationMemory, create_conversation_memory
from rag.services.response_composer import ResponseComposer, create_response_composer

logger = logging.getLogger(__name__)


@dataclass
class PipelineConfig:
    """Configuration for the RAG pipeline."""
    groq_api_key: str
    embedding_model: str = "all-MiniLM-L6-v2"
    llm_model: str = "llama-3-70b-versatile"
    confidence_threshold: float = 0.7
    max_history_length: int = 20
    memory_ttl_seconds: int = 3600
    collections: List[Dict] = None

    def __post_init__(self):
        if self.collections is None:
            self.collections = [
                {
                    "name": "agriculture",
                    "persist_directory": "./data/chroma_agriculture",
                    "top_k": 5,
                },
                {
                    "name": "company",
                    "persist_directory": "./data/chroma_company",
                    "top_k": 3,
                },
            ]


class RAGPipeline:
    """
    Complete RAG Pipeline orchestration.
    Integrates all services for end-to-end RAG functionality.
    """

    def __init__(self, config: PipelineConfig):
        """
        Initialize RAG pipeline.

        Args:
            config: Pipeline configuration
        """
        self.config = config

        # Initialize all services
        self.intent_classifier = create_intent_classifier()
        self.vector_retriever = None  # Initialized lazily
        self.reranker = create_reranker()
        self.groq_fallback = create_groq_fallback_service(
            api_key=config.groq_api_key,
            model=config.llm_model,
        )
        self.action_generator = create_action_generator()
        self.conversation_memory = create_conversation_memory(
            max_history_length=config.max_history_length,
            memory_ttl_seconds=config.memory_ttl_seconds,
        )
        self.response_composer = create_response_composer(
            confidence_threshold=config.confidence_threshold,
        )

        self._initialized = False

    def initialize(self):
        """Initialize vector retriever and other dependencies."""
        if self._initialized:
            return

        from rag.services.embedding import create_embedding_service

        # Initialize embedding service
        embedding_service = create_embedding_service(
            model_name=self.config.embedding_model,
        )

        # Initialize vector retriever
        self.vector_retriever = create_vector_retriever(
            collections_config=self.config.collections,
            embedding_service=embedding_service,
        )

        self._initialized = True
        logger.info("RAG Pipeline initialized")

    async def process_query(
        self,
        question: str,
        session_id: str = "default",
        user_id: str = None,
        conversation_history: List[Dict] = None,
    ) -> Dict:
        """
        Process a user query through the complete RAG pipeline.

        Args:
            question: User question
            session_id: Session identifier
            user_id: User identifier
            conversation_history: Previous messages

        Returns:
            Complete response with answer, actions, sources, etc.
        """
        # Ensure initialized
        self.initialize()

        # Get or create session
        session = self.conversation_memory.get_or_create_session(session_id, user_id)

        # Check for repeated questions
        if self.conversation_memory.should_skip_repeated_question(session_id, question):
            return {
                "answer": "您已经问过这个问题了。请查看之前的回答或尝试新问题。",
                "confidence": 1.0,
                "sources": ["memory"],
                "actions": [],
            }

        # Step 1: Intent Classification
        intent_classification = self.intent_classifier.classify(question)
        intent = intent_classification.intent
        entities = intent_classification.entities

        logger.info(f"Intent: {intent.value}, Confidence: {intent_classification.confidence:.2f}")

        # Handle unrelated queries
        if intent == Intent.UNRELATED:
            response = self._create_unrelated_response()
            self.conversation_memory.add_turn(session_id, question, response["answer"], intent.value)
            return response

        # Step 2: Retrieve from vector collections
        target_collections = self.intent_classifier.get_target_collections(intent)

        rag_result = None
        if target_collections and self.vector_retriever.is_ready():
            retrieval_result = self.vector_retriever.retrieve(
                query=question,
                target_collections=target_collections,
                top_k=5,
                min_score=0.3,
            )

            if retrieval_result.chunks:
                # Rerank results
                chunk_tuples = [
                    (c.text, c.metadata, c.score, c.collection)
                    for c in retrieval_result.chunks
                ]
                ranked_chunks = self.reranker.rerank(chunk_tuples, question, top_k=3)

                rag_result = {
                    "chunks": [
                        {
                            "text": c.text,
                            "metadata": c.metadata,
                            "score": c.final_score,
                            "collection": c.collection,
                        }
                        for c in ranked_chunks
                    ],
                    "avg_score": retrieval_result.avg_score,
                    "max_score": retrieval_result.max_score,
                }

        # Step 3: Generate Groq fallback if needed
        groq_result = None
        use_groq = (
            not rag_result or
            not rag_result.get("chunks") or
            rag_result.get("max_score", 0) < self.config.confidence_threshold
        )

        if use_groq and intent not in [Intent.COMPANY, Intent.POLICY]:
            try:
                context = ""
                if rag_result and rag_result.get("chunks"):
                    context = "\n".join(c["text"][:500] for c in rag_result["chunks"][:2])

                groq_result = await self.groq_fallback.get_response(
                    question=question,
                    context=context,
                    conversation_history=conversation_history or [],
                )
                groq_content = groq_result.content if hasattr(groq_result, 'content') else str(groq_result)
            except Exception as e:
                logger.error(f"Groq fallback failed: {e}")
                groq_content = None

        # Step 4: Generate UI actions
        actions = self.action_generator.generate_actions(
            query=question,
            intent=intent.value,
            entities=entities,
            context={"user_context": self.conversation_memory.get_user_context(session_id)},
        )

        # Step 5: Compose response
        response = self.response_composer.compose(
            rag_result=rag_result,
            groq_result=groq_content if hasattr(groq_content, '__iter__') else None,
            llm_result=None,
            intent=intent.value,
            entities=entities,
            actions=[a.to_dict() for a in actions],
            user_context=self.conversation_memory.get_user_context(session_id),
        )

        # Format final response
        final_response = self.response_composer.format_response(response)

        # Add session tracking
        self.conversation_memory.add_turn(
            session_id=session_id,
            question=question,
            answer=final_response["answer"],
            intent=intent.value,
            entities=entities,
            actions=[a.to_dict() for a in actions],
        )

        return final_response

    def _create_unrelated_response(self) -> Dict:
        """Create response for unrelated queries."""
        return {
            "answer": "我是VaagAI智能农业助手，专门帮助农民解答农业相关问题。我可以帮您了解作物种植、市场行情、政府补贴、天气预报等信息。请问我如何帮助您？",
            "confidence": 1.0,
            "confidence_level": "high",
            "sources": [],
            "retrieved_documents": [],
            "actions": [
                {
                    "type": "OpenPage",
                    "page": "support",
                    "parameters": {},
                    "description": "联系客服获取更多帮助",
                }
            ],
            "related_features": ["农业助手", "客服支持"],
            "next_steps": ["询问农业问题", "查看市场行情", "了解政府补贴"],
            "warning": None,
        }

    def get_collection_status(self) -> Dict:
        """Get status of all collections."""
        if not self.vector_retriever:
            return {"error": "Pipeline not initialized"}
        return self.vector_retriever.get_collection_status()

    def add_documents(self, collection_name: str, chunks: List[tuple]) -> int:
        """Add documents to a collection."""
        if not self.vector_retriever:
            self.initialize()
        return self.vector_retriever.add_documents(collection_name, chunks)

    def clear_session(self, session_id: str):
        """Clear a conversation session."""
        self.conversation_memory.clear_session(session_id)


def create_rag_pipeline(config: PipelineConfig) -> RAGPipeline:
    """Factory function to create RAG pipeline."""
    return RAGPipeline(config=config)