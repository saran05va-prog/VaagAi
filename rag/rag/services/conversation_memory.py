"""
Conversation Memory Service
Maintains conversation context and user preferences.
"""

import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)


@dataclass
class ConversationTurn:
    """A single conversation turn."""
    question: str
    answer: str
    intent: str
    timestamp: datetime
    entities: Dict[str, str] = field(default_factory=dict)
    actions: List[Dict] = field(default_factory=list)


@dataclass
class UserContext:
    """User context and preferences."""
    user_id: str
    selected_crop: Optional[str] = None
    preferred_language: str = "en"
    current_location: Optional[str] = None
    recent_searches: List[str] = field(default_factory=list)
    current_page: Optional[str] = None
    recent_recommendations: List[Dict] = field(default_factory=list)
    conversation_history: List[ConversationTurn] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)


class ConversationMemory:
    """Manages conversation memory for each user session."""

    def __init__(
        self,
        max_history_length: int = 20,
        memory_ttl_seconds: int = 3600,
    ):
        """
        Initialize conversation memory.

        Args:
            max_history_length: Maximum conversation turns to store
            memory_ttl_seconds: Time-to-live for memory entries
        """
        self.max_history_length = max_history_length
        self.memory_ttl_seconds = memory_ttl_seconds
        self.sessions: Dict[str, UserContext] = {}
        self.session_timestamps: Dict[str, datetime] = {}

    def get_or_create_session(self, session_id: str, user_id: str = None) -> UserContext:
        """Get or create a user session."""
        # Check if session exists and is valid
        if session_id in self.sessions:
            if self._is_session_valid(session_id):
                return self.sessions[session_id]
            else:
                # Clear expired session
                self.clear_session(session_id)

        # Create new session
        user_context = UserContext(
            user_id=user_id or session_id,
        )
        self.sessions[session_id] = user_context
        self.session_timestamps[session_id] = datetime.now()

        logger.info(f"Created new session: {session_id}")
        return user_context

    def _is_session_valid(self, session_id: str) -> bool:
        """Check if session is still valid."""
        if session_id not in self.session_timestamps:
            return False

        age = datetime.now() - self.session_timestamps[session_id]
        return age.total_seconds() < self.memory_ttl_seconds

    def add_turn(
        self,
        session_id: str,
        question: str,
        answer: str,
        intent: str,
        entities: Dict[str, str] = None,
        actions: List[Dict] = None,
    ):
        """Add a conversation turn to session."""
        if session_id not in self.sessions:
            return

        turn = ConversationTurn(
            question=question,
            answer=answer,
            intent=intent,
            timestamp=datetime.now(),
            entities=entities or {},
            actions=actions or [],
        )

        session = self.sessions[session_id]
        session.conversation_history.append(turn)

        # Trim history if needed
        if len(session.conversation_history) > self.max_history_length:
            session.conversation_history = session.conversation_history[-self.max_history_length:]

        # Update entities
        if entities:
            if entities.get("crop"):
                session.selected_crop = entities["crop"]
            if entities.get("location"):
                session.current_location = entities["location"]
            if "search" in entities:
                session.recent_searches.append(entities["search"])
                if len(session.recent_searches) > 10:
                    session.recent_searches = session.recent_searches[-10:]

    def update_context(
        self,
        session_id: str,
        selected_crop: str = None,
        preferred_language: str = None,
        current_location: str = None,
        current_page: str = None,
    ):
        """Update user context."""
        if session_id not in self.sessions:
            return

        session = self.sessions[session_id]
        if selected_crop:
            session.selected_crop = selected_crop
        if preferred_language:
            session.preferred_language = preferred_language
        if current_location:
            session.current_location = current_location
        if current_page:
            session.current_page = current_page

    def get_conversation_history(
        self,
        session_id: str,
        max_turns: int = 10,
    ) -> List[Dict]:
        """Get conversation history for a session."""
        if session_id not in self.sessions:
            return []

        history = self.sessions[session_id].conversation_history
        recent = history[-max_turns:] if max_turns else history

        return [
            {
                "question": turn.question,
                "answer": turn.answer,
                "intent": turn.intent,
                "timestamp": turn.timestamp.isoformat(),
            }
            for turn in recent
        ]

    def get_user_context(self, session_id: str) -> Dict:
        """Get user context for a session."""
        if session_id not in self.sessions:
            return {}

        session = self.sessions[session_id]
        return {
            "selected_crop": session.selected_crop,
            "preferred_language": session.preferred_language,
            "current_location": session.current_location,
            "recent_searches": session.recent_searches,
            "current_page": session.current_page,
            "recent_recommendations": session.recent_recommendations,
        }

    def should_skip_repeated_question(self, session_id: str, question: str) -> bool:
        """Check if question is repeated and should be skipped."""
        if session_id not in self.sessions:
            return False

        history = self.sessions[session_id].conversation_history
        question_lower = question.lower()

        # Check recent questions
        for turn in history[-5:]:
            if question_lower == turn.question.lower():
                return True
            # Check for very similar questions
            if self._calculate_similarity(question_lower, turn.question.lower()) > 0.8:
                return True

        return False

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity."""
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union)

    def clear_session(self, session_id: str):
        """Clear a session."""
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.session_timestamps:
            del self.session_timestamps[session_id]

        logger.info(f"Cleared session: {session_id}")

    def cleanup_expired_sessions(self):
        """Clean up expired sessions."""
        expired = []
        for session_id in self.sessions:
            if not self._is_session_valid(session_id):
                expired.append(session_id)

        for session_id in expired:
            self.clear_session(session_id)

        if expired:
            logger.info(f"Cleaned up {len(expired)} expired sessions")


def create_conversation_memory(
    max_history_length: int = 20,
    memory_ttl_seconds: int = 3600,
) -> ConversationMemory:
    """Factory function to create conversation memory."""
    return ConversationMemory(
        max_history_length=max_history_length,
        memory_ttl_seconds=memory_ttl_seconds,
    )