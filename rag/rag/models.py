"""
Pydantic models for RAG service request/response schemas.
Enhanced for multi-collection RAG system.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ConfidenceLevel(str, Enum):
    """Confidence levels for responses."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


# ==================== Intent Classification Models ====================

class IntentClassificationRequest(BaseModel):
    """Request to classify intent."""
    question: str


class IntentClassificationResponse(BaseModel):
    """Response with classified intent."""
    intent: str
    confidence: float
    keywords: List[str]
    sub_intents: List[str]
    entities: Dict[str, str]
    target_collections: List[str]


# ==================== Core RAG Models ====================

class AskRequest(BaseModel):
    """Request schema for the /ask endpoint."""
    question: str = Field(..., description="The user's question about farming")
    session_id: str = Field(default="default", description="Session identifier")
    user_id: Optional[str] = Field(None, description="User identifier")
    language: str = Field(default="en", description="Response language")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="Previous conversation messages"
    )


class UIAction(BaseModel):
    """A UI action to be performed."""
    type: str = Field(..., description="Action type")
    page: Optional[str] = Field(None, description="Target page")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    description: str = Field(default="", description="Action description")


class Citation(BaseModel):
    """A citation from retrieved document."""
    source: str = Field(..., description="Source document name")
    content: str = Field(..., description="Relevant chunk content")
    score: float = Field(..., description="Similarity score")


class AskResponse(BaseModel):
    """Enhanced response schema for the /ask endpoint."""
    answer: str = Field(..., description="Generated answer with citations")
    confidence: float = Field(..., description="Confidence score (0-1)")
    confidence_level: ConfidenceLevel = Field(..., description="Confidence level")
    sources: List[str] = Field(default_factory=list, description="Sources used")
    retrieved_documents: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Retrieved document chunks"
    )
    actions: List[UIAction] = Field(default_factory=list, description="UI actions to perform")
    related_features: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)
    warning: Optional[str] = Field(None, description="Warning if any")


# ==================== Market Analysis Models ====================

class MarketAnalysisRequest(BaseModel):
    """Request for market analysis."""
    location: str = Field(..., description="Location to analyze")
    crop: Optional[str] = Field(None, description="Crop to focus on")
    include_trend: bool = Field(default=True, description="Include trend analysis")


class MarketAnalysisResponse(BaseModel):
    """Response with market analysis."""
    location: str
    crop: str
    current_price: str
    trend: str
    demand: str
    supply: str
    recommendations: List[str]
    risk_level: str
    selling_period: str
    insights: str
    actions: List[UIAction]


# ==================== Document Ingestion Models ====================

class IngestRequest(BaseModel):
    """Request schema for document ingestion."""
    collection: str = Field(default="agriculture", description="Target collection")
    file_path: Optional[str] = Field(None, description="Path to file to ingest")
    directory: Optional[str] = Field(None, description="Path to directory to ingest")
    metadata: Optional[Dict[str, str]] = Field(None, description="Document metadata")


class IngestResponse(BaseModel):
    """Response schema for document ingestion."""
    status: str = Field(..., description="Status of ingestion")
    collection: str = Field(..., description="Target collection")
    documents_processed: int = Field(..., description="Number of documents processed")
    chunks_created: int = Field(..., description="Number of chunks created")
    message: str = Field(..., description="Status message")


# ==================== Health Check Models ====================

class CollectionStatus(BaseModel):
    """Status of a collection."""
    name: str
    ready: bool
    document_count: int
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Response schema for health check."""
    status: str
    embedding_model: str
    llm_model: str
    groq_available: bool
    collections: List[CollectionStatus]
    total_documents: int


# ==================== Conversation Memory Models ====================

class SessionRequest(BaseModel):
    """Request to manage session."""
    session_id: str
    action: str = Field(..., description="Action: get, clear")


class SessionResponse(BaseModel):
    """Response with session data."""
    session_id: str
    context: Dict[str, Any]
    conversation_history: List[Dict[str, Any]]
    message: str