"""
VaagAI FastAPI Backend
Disease Analysis & AI Farming Assistant
"""

import os
import io
import base64
import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Import services
from app.services.disease_service import get_disease_analyzer, get_llm_recommendations
from app.services.llm_service import get_gemini_response, generate_chat_response

# Configure logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# MongoDB connection
mongodb_client = None
db = None


async def connect_db():
    """Connect to MongoDB."""
    global mongodb_client, db
    mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    try:
        mongodb_client = AsyncIOMotorClient(mongo_uri)
        db = mongodb_client.vaagai
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.warning(f"MongoDB connection failed: {e}")


async def close_db():
    """Close MongoDB connection."""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan."""
    await connect_db()
    yield
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="VaagAI Python Backend",
    description="Disease analysis and AI farming assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# Health Check
# ========================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "modules": ["crop", "disease", "assistant"]
    }


# ========================================
# Disease Analysis
# ========================================

class AnalyzeRequest(BaseModel):
    image: str  # Base64 encoded
    mime_type: str
    crop_name: str
    location: str = "Unknown"


@app.post("/api/disease/analyze")
async def analyze_disease(request: AnalyzeRequest):
    """Analyze crop disease from image."""
    try:
        # Decode image
        image_data = base64.b64decode(request.image)
        from PIL import Image
        image = Image.open(io.BytesIO(image_data))

        # Get disease analyzer
        analyzer = get_disease_analyzer()

        # Classify disease
        result = analyzer.classify_disease(image, request.crop_name)

        # Segment disease region
        segmentation = analyzer.segment_disease_region(image)

        if segmentation:
            result["bounding_box"] = segmentation["bounding_box"]
            result["affected_ratio"] = round(segmentation["affected_ratio"], 2)

            # Calculate severity
            severity = analyzer.calculate_severity(segmentation["affected_ratio"])
            result["severity"] = severity
        else:
            result["affected_ratio"] = 0.0
            result["severity"] = "Healthy"

        # Get LLM recommendations
        try:
            recommendations = get_llm_recommendations(
                crop=request.crop_name,
                disease=result["disease"],
                severity=result.get("severity", "Unknown"),
                location=request.location
            )
            result["recommendations"] = recommendations
        except Exception as e:
            logger.warning(f"LLM recommendations failed: {e}")

        # Save to MongoDB (background task)
        if db:
            try:
                record = {
                    "user_id": "anonymous",
                    "crop_name": request.crop_name,
                    "disease": result["disease"],
                    "severity": result.get("severity", "Unknown"),
                    "confidence": result["confidence"],
                    "location": request.location,
                    "recommendations": result.get("recommendations"),
                    "created_at": __import__("datetime").datetime.utcnow()
                }
                await db.disease_records.insert_one(record)
            except Exception as e:
                logger.warning(f"Failed to save record: {e}")

        return result

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# Disease History
# ========================================

class HistoryRequest(BaseModel):
    user_id: str
    limit: int = 20
    skip: int = 0


@app.post("/api/disease/history")
async def get_disease_history(request: HistoryRequest):
    """Get disease analysis history."""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        records = await db.disease_records.find(
            {"user_id": request.user_id}
        ).sort("created_at", -1).skip(request.skip).limit(request.limit).to_list(request.limit)

        # Convert ObjectId to string
        for record in records:
            record["_id"] = str(record["_id"])

        return {"records": records, "total": len(records)}
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/disease/history/{record_id}")
async def delete_history_record(record_id: str):
    """Delete a disease history record."""
    if not db:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        result = await db.disease_records.delete_one({"_id": ObjectId(record_id)})
        return {"status": "success", "deleted": result.deleted_count}
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# AI Assistant Chat
# ========================================

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: str = ""


@app.post("/api/assistant/chat")
async def chat_with_assistant(request: ChatRequest):
    """Chat with AI farming assistant."""
    try:
        response = await generate_chat_response(
            messages=[{"role": m.role, "content": m.content} for m in request.messages],
            context=request.context
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# Run Server
# ========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)