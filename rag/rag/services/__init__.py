"""
RAG Services Package
Exports all service modules for the enhanced RAG system.
"""

# Core RAG services
from rag.services.config import settings
from rag.services.intent_classifier import (
    IntentClassifier,
    Intent,
    IntentClassification,
    create_intent_classifier,
)
from rag.services.retriever import (
    VectorRetriever,
    RetrievalResult,
    RetrievedChunk,
    create_vector_retriever,
)
from rag.services.reranker import (
    ReRanker,
    RankedChunk,
    create_reranker,
)
from rag.services.groq_fallback import (
    GroqFallbackService,
    GroqResponse,
    create_groq_fallback_service,
)
from rag.services.action_generator import (
    ActionGenerator,
    ActionType,
    UIAction,
    create_action_generator,
)
from rag.services.conversation_memory import (
    ConversationMemory,
    UserContext,
    ConversationTurn,
    create_conversation_memory,
)
from rag.services.response_composer import (
    ResponseComposer,
    ResponseComponents,
    ConfidenceLevel,
    create_response_composer,
)
from rag.services.market_analysis import (
    MarketAnalysisService,
    MarketData,
    MarketAnalysis,
    create_market_analysis_service,
)
from rag.services.pipeline import (
    RAGPipeline,
    PipelineConfig,
    create_rag_pipeline,
)

__all__ = [
    # Config
    "settings",
    # Intent Classification
    "IntentClassifier",
    "Intent",
    "IntentClassification",
    "create_intent_classifier",
    # Retrieval
    "VectorRetriever",
    "RetrievalResult",
    "RetrievedChunk",
    "create_vector_retriever",
    # Re-ranking
    "ReRanker",
    "RankedChunk",
    "create_reranker",
    # Groq Fallback
    "GroqFallbackService",
    "GroqResponse",
    "create_groq_fallback_service",
    # Actions
    "ActionGenerator",
    "ActionType",
    "UIAction",
    "create_action_generator",
    # Conversation Memory
    "ConversationMemory",
    "UserContext",
    "ConversationTurn",
    "create_conversation_memory",
    # Response Composer
    "ResponseComposer",
    "ResponseComponents",
    "ConfidenceLevel",
    "create_response_composer",
    # Market Analysis
    "MarketAnalysisService",
    "MarketData",
    "MarketAnalysis",
    "create_market_analysis_service",
    # Pipeline
    "RAGPipeline",
    "PipelineConfig",
    "create_rag_pipeline",
]