"""
Groq Fallback Service
Provides external knowledge when RAG confidence is low.
"""

import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class GroqResponse:
    """Response from Groq API."""
    content: str
    model: str
    usage: Dict
    sources: List[str]


class GroqFallbackService:
    """Handles Groq API fallback for external knowledge."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3-70b-versatile",
        base_url: str = "https://api.groq.com/openai/v1/chat/completions",
    ):
        """
        Initialize Groq fallback service.

        Args:
            api_key: Groq API key
            model: Groq model to use
            base_url: API endpoint URL
        """
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self._session = None

        # Agriculture-focused system prompt
        self.system_prompt = """You are VaagAI Smart Farm Assistant, an agricultural expert bot.

IMPORTANT RESTRICTIONS:
- Only answer agriculture-related questions
- For non-agriculture questions, politely redirect to farming topics or company support
- Never provide medical, legal, or financial advice outside agriculture
- If you don't know something, say so honestly

Your expertise includes:
- Crop cultivation and management
- Soil health and fertilizers
- Pest and disease management
- Irrigation techniques
- Weather and climate for farming
- Market prices and economics
- Government agricultural schemes
- Modern farming techniques
- Livestock management (related to farming)

Always provide helpful, practical advice tailored to Indian agriculture when applicable."""

    async def get_response(
        self,
        question: str,
        context: str = "",
        conversation_history: List[Dict] = None,
        temperature: float = 0.5,
        max_tokens: int = 1024,
    ) -> GroqResponse:
        """
        Get response from Groq API.

        Args:
            question: User question
            context: Additional context from RAG
            conversation_history: Previous messages
            temperature: Sampling temperature
            max_tokens: Max tokens in response

        Returns:
            GroqResponse with content and metadata
        """
        messages = [{"role": "system", "content": self.system_prompt}]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Add RAG context if available
        if context:
            messages.append({
                "role": "system",
                "content": f"Relevant context from knowledge base:\n{context}"
            })

        # Add current question
        messages.append({"role": "user", "content": question})

        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                ) as response:
                    if not response.ok:
                        error_text = await response.text()
                        logger.error(f"Groq API error: {response.status} {error_text}")
                        raise Exception(f"Groq API error: {response.status}")

                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    usage = data.get("usage", {})

                    return GroqResponse(
                        content=content,
                        model=data.get("model", self.model),
                        usage=usage,
                        sources=["groq"],
                    )

        except ImportError:
            # Fallback to sync requests if aiohttp not available
            return await self._sync_request(messages, temperature, max_tokens)

    async def _sync_request(
        self,
        messages: List[Dict],
        temperature: float,
        max_tokens: int,
    ) -> GroqResponse:
        """Synchronous request fallback."""
        import urllib.request
        import json

        data = json.dumps({
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }).encode("utf-8")

        req = urllib.request.Request(
            self.base_url,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
        )

        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode("utf-8"))
                content = result["choices"][0]["message"]["content"]
                usage = result.get("usage", {})

                return GroqResponse(
                    content=content,
                    model=result.get("model", self.model),
                    usage=usage,
                    sources=["groq"],
                )
        except Exception as e:
            logger.error(f"Groq sync request failed: {e}")
            raise

    async def search_agriculture_knowledge(
        self,
        query: str,
        context: str = "",
    ) -> str:
        """
        Search agricultural knowledge using Groq.

        Args:
            query: Search query
            context: Existing context

        Returns:
            Generated answer from Groq
        """
        prompt = f"""Based on your agricultural knowledge, provide a helpful answer to this question:

Question: {query}

{f'Context from knowledge base: {context}' if context else ''}

Provide a concise, accurate answer focused on Indian agriculture."""

        try:
            response = await self.get_response(prompt, context="")
            return response.content
        except Exception as e:
            logger.error(f"Groq search failed: {e}")
            return ""

    def check_api_health(self) -> bool:
        """Check if Groq API is accessible."""
        try:
            import urllib.request
            import json

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )

            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"Groq health check failed: {e}")
            return False


def create_groq_fallback_service(
    api_key: str,
    model: str = "llama-3-70b-versatile",
) -> GroqFallbackService:
    """Factory function to create Groq fallback service."""
    return GroqFallbackService(api_key=api_key, model=model)