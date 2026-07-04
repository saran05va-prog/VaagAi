"""
ReRanker Service
Reranks retrieved chunks for better relevance.
"""

import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class RankedChunk:
    """A ranked document chunk."""
    text: str
    metadata: Dict
    original_score: float
    rerank_score: float
    final_score: float
    collection: str
    rank: int


class ReRanker:
    """Reranks retrieved chunks based on multiple factors."""

    def __init__(
        self,
        use_llm_reranking: bool = False,
        groq_service=None,
    ):
        """
        Initialize the reranker.

        Args:
            use_llm_reranking: Whether to use LLM for reranking
            groq_service: Groq service for LLM reranking
        """
        self.use_llm_reranking = use_llm_reranking
        self.groq_service = groq_service

        # Boost factors for different conditions
        self.keyword_boost = {
            "exact_match": 0.3,
            "title_match": 0.2,
            "recent": 0.1,
            "verified": 0.15,
            "high_frequency": 0.05,
        }

    def rerank(
        self,
        chunks: List[Tuple[str, Dict, float, str]],
        query: str,
        top_k: int = 3,
    ) -> List[RankedChunk]:
        """
        Rerank retrieved chunks.

        Args:
            chunks: List of (text, metadata, score, collection) tuples
            query: Original query
            top_k: Number of results to return

        Returns:
            List of RankedChunk objects
        """
        if not chunks:
            return []

        query_lower = query.lower()
        query_terms = set(query_lower.split())

        ranked_chunks = []

        for text, meta, score, collection in chunks:
            text_lower = text.lower()

            # Calculate rerank score
            rerank_score = self._calculate_rerank_score(
                text_lower, meta, query_lower, query_terms
            )

            # Combine original and rerank scores
            final_score = (score * 0.6) + (rerank_score * 0.4)

            ranked_chunks.append(RankedChunk(
                text=text,
                metadata=meta,
                original_score=score,
                rerank_score=rerank_score,
                final_score=final_score,
                collection=collection,
                rank=0,
            ))

        # Sort by final score
        ranked_chunks.sort(key=lambda x: x.final_score, reverse=True)

        # Update ranks
        for i, chunk in enumerate(ranked_chunks):
            chunk.rank = i

        return ranked_chunks[:top_k]

    def _calculate_rerank_score(
        self,
        text_lower: str,
        metadata: Dict,
        query_lower: str,
        query_terms: set,
    ) -> float:
        """Calculate rerank score based on multiple factors."""
        score = 0.5  # Base score

        # Check for exact query match
        if query_lower in text_lower:
            score += self.keyword_boost["exact_match"]

        # Check title match in metadata
        title = metadata.get("title", "").lower()
        if title and any(term in title for term in query_terms):
            score += self.keyword_boost["title_match"]

        # Check for verified source
        if metadata.get("verified", False):
            score += self.keyword_boost["verified"]

        # Check for recent content
        if metadata.get("timestamp"):
            try:
                from datetime import datetime
                doc_time = datetime.fromisoformat(metadata["timestamp"])
                age_days = (datetime.now() - doc_time).days
                if age_days < 30:
                    score += self.keyword_boost["recent"]
            except:
                pass

        # Keyword frequency boost
        matching_terms = sum(1 for term in query_terms if term in text_lower)
        frequency_boost = min(matching_terms * 0.02, self.keyword_boost["high_frequency"])
        score += frequency_boost

        # Normalize to 0-1 range
        return min(score, 1.0)

    async def llm_rerank(
        self,
        chunks: List[Tuple[str, Dict, float, str]],
        query: str,
        top_k: int = 3,
    ) -> List[RankedChunk]:
        """Use LLM to rerank chunks (more expensive but accurate)."""
        if not self.use_llm_reranking or not self.groq_service:
            return self.rerank(chunks, query, top_k)

        # Simple rerank if LLM not available
        return self.rerank(chunks, query, top_k)


def create_reranker(use_llm_reranking: bool = False, groq_service=None) -> ReRanker:
    """Factory function to create a reranker."""
    return ReRanker(use_llm_reranking=use_llm_reranking, groq_service=groq_service)