"""
LLM Service
Handles Gemini API calls for recommendations and chat.
"""

import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Try to import google-generativeai
try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed")


SYSTEM_PROMPT = """You are VAAGAI, an expert AI farming assistant for Indian farmers.
Answer questions about crop diseases, fertilizers, weather, pest control, irrigation, and market prices.
Be concise and practical. When recommending treatments, prefer locally available and affordable options.
Respond in a friendly, helpful tone."""


def get_gemini_client():
    """Get Gemini client."""
    if not GEMINI_AVAILABLE:
        return None

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set")
        return None

    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to create Gemini client: {e}")
        return None


async def generate_chat_response(messages: List[Dict[str, str]], context: str = "") -> str:
    """Generate chat response from Gemini."""
    client = get_gemini_client()

    if not client:
        return _get_fallback_response(messages[-1]["content"] if messages else "")

    try:
        # Build conversation
        contents = []

        # Add system context
        if context:
            contents.append(f"Context: {context}")

        # Add history
        for msg in messages[-5:]:  # Last 5 messages
            contents.append(f"{msg['role']}: {msg['content']}")

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=SYSTEM_PROMPT + "\n\n" + "\n\n".join(contents)
        )

        return response.text

    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        return _get_fallback_response(messages[-1]["content"] if messages else "")


def _get_fallback_response(question: str) -> str:
    """Fallback responses when LLM is unavailable."""
    question_lower = question.lower()

    if "yellow" in question_lower or "leaves" in question_lower:
        return "Yellowing leaves can be caused by several factors: nitrogen deficiency, overwatering, or diseases. I recommend checking soil moisture and considering a nitrogen fertilizer application."

    if "urea" in question_lower or "fertilizer" in question_lower:
        return "For urea application: use 60-70 kg per acre for rice, 45-50 kg for wheat. Apply in 2-3 split doses for better efficiency."

    if "blight" in question_lower or "disease" in question_lower:
        return "For leaf blight control: remove infected leaves, apply copper-based fungicide, ensure proper spacing for air circulation. Consider neem oil as organic option."

    return "I'm here to help with your farming questions. Please provide more details about your specific concern."


# Alias for backward compatibility
get_llm_recommendations = None  # Import from disease_service instead