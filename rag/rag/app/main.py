"""
RAG Service FastAPI Application (Enhanced Version)
Complete RAG pipeline with multi-collection support, intent classification,
UI actions, and market analysis.
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

from rag.config import settings
from rag.models import (
    AskRequest,
    AskResponse,
    UIAction,
    Citation,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    MarketAnalysisRequest,
    MarketAnalysisResponse,
    IntentClassificationRequest,
    IntentClassificationResponse,
    CollectionStatus,
    SessionRequest,
    SessionResponse,
)
from rag.services.pipeline import RAGPipeline, PipelineConfig
from rag.services.intent_classifier import create_intent_classifier
from rag.services.market_analysis import create_market_analysis_service
from rag.services.conversation_memory import create_conversation_memory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global service instances
rag_pipeline: RAGPipeline = None
intent_classifier = None
market_analysis_service = None
conversation_memory = None


def initialize_services():
    """Initialize all RAG services."""
    global rag_pipeline, intent_classifier, market_analysis_service, conversation_memory

    logger.info("Initializing enhanced RAG services...")

    # Check for API key
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set in environment")

    # Create pipeline config
    config = PipelineConfig(
        groq_api_key=settings.groq_api_key,
        embedding_model=settings.embedding_model,
        llm_model=settings.llm_model,
        confidence_threshold=settings.confidence_threshold,
        max_history_length=settings.max_history_length,
        memory_ttl_seconds=settings.memory_ttl_seconds,
        collections=[
            {
                "name": "agriculture",
                "persist_directory": str(settings.get_documents_dir() / "chroma_agriculture"),
                "top_k": 5,
            },
            {
                "name": "company",
                "persist_directory": str(settings.get_documents_dir() / "chroma_company"),
                "top_k": 3,
            },
        ],
    )

    # Initialize pipeline
    rag_pipeline = RAGPipeline(config)
    rag_pipeline.initialize()

    # Initialize intent classifier
    intent_classifier = create_intent_classifier()

    # Initialize market analysis service
    from rag.services.groq_fallback import create_groq_fallback_service
    groq_service = create_groq_fallback_service(
        api_key=settings.groq_api_key,
        model=settings.llm_model,
    )
    market_analysis_service = create_market_analysis_service(
        groq_service=groq_service,
        market_api_url=settings.market_api_url,
        market_api_key=settings.market_api_key,
    )

    # Initialize conversation memory
    conversation_memory = create_conversation_memory(
        max_history_length=settings.max_history_length,
        memory_ttl_seconds=settings.memory_ttl_seconds,
    )

    logger.info("Enhanced RAG services initialized successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting enhanced RAG service...")
    try:
        initialize_services()
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down RAG service...")


# Create FastAPI app
app = FastAPI(
    title="VaagAI Enhanced RAG Service",
    description="Production-ready RAG with intent classification, UI actions, and market analysis",
    version="2.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health Endpoints ====================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Enhanced health check endpoint."""
    collection_status = {}

    if rag_pipeline:
        collection_status = rag_pipeline.get_collection_status()

    from rag.services.groq_fallback import create_groq_fallback_service
    groq_service = create_groq_fallback_service(api_key=settings.groq_api_key)
    groq_available = groq_service.check_api_health()

    collections = []
    total_docs = 0

    for name, status in collection_status.items():
        collections.append(CollectionStatus(
            name=name,
            ready=status.get("ready", False),
            document_count=status.get("document_count", 0),
            error=status.get("error"),
        ))
        total_docs += status.get("document_count", 0)

    return HealthResponse(
        status="ok",
        embedding_model=settings.embedding_model,
        llm_model=settings.llm_model,
        groq_available=groq_available,
        collections=collections,
        total_documents=total_docs,
    )


@app.get("/collections")
async def get_collections():
    """Get status of all collections."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="Service not initialized")

    return rag_pipeline.get_collection_status()


# ==================== Intent Classification ====================

@app.post("/classify", response_model=IntentClassificationResponse)
async def classify_intent(request: IntentClassificationRequest):
    """Classify user intent from query."""
    if not intent_classifier:
        raise HTTPException(status_code=503, detail="Service not initialized")

    classification = intent_classifier.classify(request.question)

    return IntentClassificationResponse(
        intent=classification.intent.value,
        confidence=classification.confidence,
        keywords=classification.keywords,
        sub_intents=classification.sub_intents,
        entities=classification.entities,
        target_collections=intent_classifier.get_target_collections(classification.intent),
    )


# ==================== Main Ask Endpoint ====================

@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """
    Ask a farm advisory question through the complete RAG pipeline.
    Returns answer with sources, actions, and confidence.
    """
    import time
    from rag.services.logging import request_logger

    start_time = time.time()

    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")

    try:
        # Process through pipeline
        result = await rag_pipeline.process_query(
            question=request.question,
            session_id=request.session_id,
            user_id=request.user_id,
            conversation_history=request.conversation_history,
        )

        # Log request
        latency_ms = (time.time() - start_time) * 1000
        request_logger.log_request(
            endpoint="/ask",
            question=request.question,
            tool_used=result.get("sources", ["unknown"]),
            latency_ms=latency_ms,
            status_code=200,
            sources_count=len(result.get("retrieved_documents", [])),
        )

        # Convert actions to UIAction objects
        actions = [UIAction(**a) for a in result.get("actions", [])]

        # Map confidence level
        from rag.services.response_composer import ConfidenceLevel
        conf_level = ConfidenceLevel(result.get("confidence_level", "medium"))

        return AskResponse(
            answer=result["answer"],
            confidence=result["confidence"],
            confidence_level=conf_level,
            sources=result["sources"],
            retrieved_documents=result["retrieved_documents"],
            actions=actions,
            related_features=result.get("related_features", []),
            next_steps=result.get("next_steps", []),
            warning=result.get("warning"),
        )

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        request_logger.log_request(
            endpoint="/ask",
            question=request.question,
            tool_used="pipeline",
            latency_ms=latency_ms,
            status_code=500,
            error=str(e),
        )
        logger.error(f"Error processing question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Streaming Ask Endpoint ====================

@app.post("/ask/stream")
async def ask_question_stream(request: AskRequest):
    """Streaming version of ask endpoint."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")

    async def event_generator():
        try:
            result = await rag_pipeline.process_query(
                question=request.question,
                session_id=request.session_id,
                user_id=request.user_id,
                conversation_history=request.conversation_history,
            )

            # Stream the answer
            answer = result.get("answer", "")
            for i in range(0, len(answer), 50):
                chunk = answer[i:i+50]
                yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                await asyncio.sleep(0.01)

            # Send final chunk with metadata
            final_data = {
                "chunk": "",
                "done": True,
                "confidence": result.get("confidence"),
                "sources": result.get("sources"),
                "actions": result.get("actions"),
            }
            yield f"data: {json.dumps(final_data)}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    import asyncio
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )


# ==================== Market Analysis ====================

@app.post("/market/analyze", response_model=MarketAnalysisResponse)
async def analyze_market(request: MarketAnalysisRequest):
    """Analyze market for a location and crop."""
    if not market_analysis_service:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        analysis = await market_analysis_service.analyze(
            location=request.location,
            crop=request.crop,
            include_trend=request.include_trend,
        )

        ui_analysis = market_analysis_service.format_for_ui(analysis)

        return MarketAnalysisResponse(
            location=analysis.location,
            crop=analysis.crop,
            current_price=ui_analysis["current_price"],
            trend=ui_analysis["trend"],
            demand=ui_analysis["demand"],
            supply=ui_analysis["supply"],
            recommendations=ui_analysis["recommendations"],
            risk_level=ui_analysis["risk_level"],
            selling_period=ui_analysis["selling_period"],
            insights=ui_analysis["insights"],
            actions=[UIAction(**a) for a in ui_analysis.get("actions", [])],
        )

    except Exception as e:
        logger.error(f"Market analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Document Ingestion ====================

@app.post("/ingest", response_model=IngestResponse)
async def ingest_documents(request: IngestRequest):
    """Ingest documents into a collection."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="Service not initialized")

    from rag.services.ingestion import create_ingestion_service

    try:
        ingestion_service = create_ingestion_service(
            chunk_size=500,
            chunk_overlap=50,
        )

        documents = []

        if request.file_path:
            docs = ingestion_service.load_document(request.file_path)
            documents.extend(docs)
        elif request.directory:
            docs = ingestion_service.load_directory(request.directory)
            documents.extend(docs)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either file_path or directory must be provided"
            )

        chunks = ingestion_service.chunk_documents(documents)

        if not chunks:
            raise HTTPException(status_code=400, detail="No text content found in documents")

        # Add metadata to chunks
        metadata = request.metadata or {}
        chunks_with_meta = [
            (text, {**meta, **metadata})
            for text, meta in chunks
        ]

        chunks_added = rag_pipeline.add_documents(
            request.collection,
            chunks_with_meta,
        )

        return IngestResponse(
            status="success",
            collection=request.collection,
            documents_processed=len(documents),
            chunks_created=chunks_added,
            message=f"Successfully processed {len(documents)} documents with {chunks_added} chunks",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ingesting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents/count")
async def get_document_count():
    """Get the number of documents in each collection."""
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="Service not initialized")

    status = rag_pipeline.get_collection_status()
    counts = {
        name: info.get("document_count", 0)
        for name, info in status.items()
    }

    return {"collections": counts, "total": sum(counts.values())}


# ==================== Session Management ====================

@app.post("/session", response_model=SessionResponse)
async def manage_session(request: SessionRequest):
    """Manage conversation session."""
    if not conversation_memory:
        raise HTTPException(status_code=503, detail="Service not initialized")

    if request.action == "clear":
        conversation_memory.clear_session(request.session_id)
        return SessionResponse(
            session_id=request.session_id,
            context={},
            conversation_history=[],
            message="Session cleared",
        )
    else:
        context = conversation_memory.get_user_context(request.session_id)
        history = conversation_memory.get_conversation_history(request.session_id)

        return SessionResponse(
            session_id=request.session_id,
            context=context,
            conversation_history=history,
            message="Session retrieved",
        )


# ==================== Feedback (Legacy Support) ====================

class FeedbackRequest(BaseModel):
    """Request schema for feedback."""
    question: str
    answer: str
    tool_used: str
    rating: int = Field(..., description="Thumbs up (1) or down (0)")
    session_id: str = "default"


class FeedbackResponse(BaseModel):
    """Response schema for feedback."""
    status: str
    message: str


# In-memory feedback store
feedback_store: list = []


@app.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(request: FeedbackRequest):
    """Submit feedback for an answer."""
    if request.rating not in [0, 1]:
        raise HTTPException(
            status_code=400,
            detail="Rating must be 0 (thumbs down) or 1 (thumbs up)"
        )

    feedback_entry = {
        "question": request.question,
        "answer": request.answer,
        "tool_used": request.tool_used,
        "rating": request.rating,
        "session_id": request.session_id,
        "timestamp": datetime.now().isoformat(),
    }

    feedback_store.append(feedback_entry)

    logger.info(
        f"Feedback received: {'thumbs up' if request.rating == 1 else 'thumbs down'} "
        f"for {request.tool_used}"
    )

    return FeedbackResponse(
        status="success",
        message=f"Feedback recorded: {'thumbs up' if request.rating == 1 else 'thumbs down'}",
    )


@app.get("/feedback/summary")
async def get_feedback_summary():
    """Get feedback summary."""
    total = len(feedback_store)
    if total == 0:
        return {"total": 0, "thumbs_up": 0, "thumbs_down": 0, "satisfaction_rate": 0.0}

    thumbs_up = sum(1 for f in feedback_store if f["rating"] == 1)
    thumbs_down = total - thumbs_up

    return {
        "total": total,
        "thumbs_up": thumbs_up,
        "thumbs_down": thumbs_down,
        "satisfaction_rate": round(thumbs_up / total, 3),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)