"""
Response Composer Service
Composes final responses with source fusion, quality checks, and safety.
"""

import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ConfidenceLevel(str, Enum):
    """Confidence levels for responses."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NONE = "none"


@dataclass
class ResponseComponents:
    """Components of a composed response."""
    answer: str
    confidence: float
    confidence_level: ConfidenceLevel
    sources: List[str]
    retrieved_documents: List[Dict]
    actions: List[Dict]
    related_features: List[str]
    next_steps: List[str]
    warning: Optional[str] = None


class ResponseComposer:
    """Composes final responses with all required components."""

    def __init__(
        self,
        confidence_threshold: float = 0.7,
        enable_source_fusion: bool = True,
    ):
        """
        Initialize response composer.

        Args:
            confidence_threshold: Threshold for high confidence
            enable_source_fusion: Enable source fusion
        """
        self.confidence_threshold = confidence_threshold
        self.enable_source_fusion = enable_source_fusion

    def compose(
        self,
        rag_result: Dict = None,
        groq_result: str = None,
        llm_result: str = None,
        intent: str = None,
        entities: Dict = None,
        actions: List[Dict] = None,
        user_context: Dict = None,
    ) -> ResponseComponents:
        """
        Compose final response from all sources.

        Priority: RAG > Company > Groq > LLM

        Args:
            rag_result: RAG retrieval result
            groq_result: Groq fallback result
            llm_result: LLM-only result
            intent: Classified intent
            entities: Extracted entities
            actions: Generated UI actions
            user_context: User context

        Returns:
            ResponseComponents with full response
        """
        # Determine sources used and confidence
        sources = []
        confidence = 0.0
        retrieved_documents = []
        answer = ""
        warning = None

        # Source fusion logic
        if rag_result and rag_result.get("chunks"):
            # RAG has relevant results
            chunks = rag_result["chunks"]
            max_score = max(c.get("score", 0) for c in chunks) if chunks else 0

            if max_score >= self.confidence_threshold:
                # High RAG confidence - use only RAG
                answer = self._generate_from_rag(chunks)
                confidence = max_score
                sources.append("vector")
                retrieved_documents = [
                    {"text": c["text"], "score": c["score"], "source": c.get("collection")}
                    for c in chunks
                ]
            else:
                # Medium RAG confidence - fuse with Groq
                answer = self._fuse_sources(rag_result, groq_result)
                confidence = min(max_score + 0.2, 0.8)
                sources = ["vector"]
                if groq_result:
                    sources.append("groq")
                    warning = "部分答案来自外部知识库"
                retrieved_documents = [
                    {"text": c["text"], "score": c["score"], "source": c.get("collection")}
                    for c in chunks
                ]
        elif groq_result:
            # No RAG results - use Groq
            answer = groq_result
            confidence = 0.5
            sources = ["groq"]
            warning = "此答案来自外部知识库，可能不准确"
        elif llm_result:
            # Fallback to LLM only
            answer = llm_result
            confidence = 0.3
            sources = ["llm"]
            warning = "此答案为AI生成，可能不准确"
        else:
            # No information available
            answer = "抱歉，我没有足够的信息来回答您的问题。请尝试其他问题或联系客服支持。"
            confidence = 0.0
            sources = []
            warning = "信息不足"

        # Determine confidence level
        confidence_level = self._get_confidence_level(confidence)

        # Generate related features and next steps
        related_features = self._generate_related_features(intent, entities)
        next_steps = self._generate_next_steps(intent, entities, actions)

        # Check for policy/safety concerns
        if intent in ["policy", "company"]:
            if "groq" in sources and "vector" not in sources:
                warning = "公司政策信息应咨询官方来源"
                confidence = min(confidence, 0.4)

        return ResponseComponents(
            answer=answer,
            confidence=confidence,
            confidence_level=confidence_level,
            sources=sources,
            retrieved_documents=retrieved_documents,
            actions=actions or [],
            related_features=related_features,
            next_steps=next_steps,
            warning=warning,
        )

    def _generate_from_rag(self, chunks: List[Dict]) -> str:
        """Generate answer from RAG chunks."""
        if not chunks:
            return "未找到相关信息"

        # Use the highest scored chunk as main answer
        main_chunk = chunks[0]
        answer = main_chunk.get("text", "")

        # Add supporting context from other chunks
        if len(chunks) > 1:
            supporting = "\n\n其他参考信息:\n"
            for chunk in chunks[1:3]:
                supporting += f"- {chunk.get('text', '')[:200]}...\n"
            answer += supporting

        return answer

    def _fuse_sources(self, rag_result: Dict, groq_result: str) -> str:
        """Fuse RAG and Groq sources."""
        if not self.enable_source_fusion:
            return self._generate_from_rag(rag_result.get("chunks", []))

        chunks = rag_result.get("chunks", [])
        if not chunks:
            return groq_result or "未找到相关信息"

        # Use RAG as primary, Groq as supplement
        answer = self._generate_from_rag(chunks)

        if groq_result:
            answer += f"\n\n补充信息:\n{groq_result[:300]}..."

        return answer

    def _get_confidence_level(self, confidence: float) -> ConfidenceLevel:
        """Determine confidence level from score."""
        if confidence >= self.confidence_threshold:
            return ConfidenceLevel.HIGH
        elif confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif confidence > 0:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.NONE

    def _generate_related_features(self, intent: str, entities: Dict) -> List[str]:
        """Generate related feature suggestions."""
        feature_mapping = {
            "agriculture": ["作物管理", "天气追踪", "市场行情"],
            "market": ["市场分析", "价格趋势", "销售策略"],
            "weather": ["天气预报", "灌溉建议", "种植日历"],
            "policy": ["政府计划", "补贴申请", "保险政策"],
            "company": ["关于我们", "客服支持", "使用指南"],
        }

        return feature_mapping.get(intent, ["智能助手", "个人中心"])

    def _generate_next_steps(
        self,
        intent: str,
        entities: Dict,
        actions: List[Dict],
    ) -> List[str]:
        """Generate suggested next steps."""
        next_steps = []

        if actions:
            next_steps.append("查看相关页面获取详细信息")

        if entities.get("crop"):
            next_steps.append(f"查看{entities['crop']}的详细种植指南")

        if entities.get("location"):
            next_steps.append(f"查看{entities['location']}的本地市场")

        next_steps.append("尝试询问相关问题获取更多帮助")

        return next_steps[:3]

    def format_response(self, components: ResponseComponents) -> Dict:
        """Format response components for API response."""
        return {
            "answer": components.answer,
            "confidence": components.confidence,
            "confidence_level": components.confidence_level.value,
            "sources": components.sources,
            "retrieved_documents": components.retrieved_documents,
            "actions": components.actions,
            "related_features": components.related_features,
            "next_steps": components.next_steps,
            "warning": components.warning,
        }

    def format_for_ui(self, components: ResponseComponents) -> Dict:
        """Format response for UI display."""
        base = self.format_response(components)

        # Add UI-specific fields
        base["display"] = {
            "show_actions": len(components.actions) > 0,
            "show_sources": len(components.sources) > 0,
            "show_warning": components.warning is not None,
            "confidence_badge": self._get_confidence_badge(components.confidence_level),
        }

        return base

    def _get_confidence_badge(self, level: ConfidenceLevel) -> Dict:
        """Get confidence badge config."""
        badges = {
            ConfidenceLevel.HIGH: {"text": "高可信度", "color": "green"},
            ConfidenceLevel.MEDIUM: {"text": "中等可信度", "color": "yellow"},
            ConfidenceLevel.LOW: {"text": "低可信度", "color": "orange"},
            ConfidenceLevel.NONE: {"text": "信息不足", "color": "red"},
        }
        return badges.get(level, {"text": "未知", "color": "gray"})


def create_response_composer(
    confidence_threshold: float = 0.7,
    enable_source_fusion: bool = True,
) -> ResponseComposer:
    """Factory function to create response composer."""
    return ResponseComposer(
        confidence_threshold=confidence_threshold,
        enable_source_fusion=enable_source_fusion,
    )