"""
Intent Classifier Service
Classifies user queries into predefined intents.
"""

import logging
from enum import Enum
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class Intent(str, Enum):
    """Supported intent types."""
    AGRICULTURE = "agriculture"
    COMPANY = "company"
    POLICY = "policy"
    MARKET = "market"
    APP_NAVIGATION = "app_navigation"
    MIXED = "mixed"
    GENERAL_CONVERSATION = "general_conversation"
    UNRELATED = "unrelated"


@dataclass
class IntentClassification:
    """Result of intent classification."""
    intent: Intent
    confidence: float
    keywords: List[str]
    sub_intents: List[str]
    entities: Dict[str, str]


class IntentClassifier:
    """Classifies user queries into intents."""

    # Keyword mappings for intent classification
    KEYWORD_PATTERNS: Dict[Intent, List[str]] = {
        Intent.AGRICULTURE: [
            "crop", "plant", "farmer", "farming", "agriculture", "soil", "seed",
            "fertilizer", "pesticide", "pest", "disease", "irrigation", "water",
            "harvest", "yield", "monsoon", "season", "weather", "rain", "drought",
            "vegetable", "fruit", "grain", "rice", "wheat", "cotton", "sugarcane",
            "groundnut", "maize", "pulses", "lentils", "gram", "turmeric",
            "ginger", "pepper", "cardamom", "coffee", "tea", "plantation",
            "organic", "compost", "manure", "nutrient", "npk", "urea", "dap",
            "government scheme", "subsidy", "kisan", "pm-kisan", "crop insurance",
            "farming technique", "plantation", "nursery", "seedling", "transplant",
            "paddy", "bajra", "jowar", "ragi", "millets", "mustard", "sunflower",
            "tomato", "onion", "potato", "brinjal", "okra", "cabbage", "cauliflower",
            "livestock", "cattle", "poultry", "dairy", "animal", "feed", "fodder",
            "equipment", "tractor", "harvester", "drone", "sprayer",
        ],
        Intent.COMPANY: [
            "about", "company", "mission", "vision", "who are you", "what is vaagai",
            "contact", "email", "phone", "address", "office", "team", "founder",
            "ceo", "management", "history", "established", "since",
        ],
        Intent.POLICY: [
            "policy", "privacy", "terms", "condition", "agreement", "refund",
            "cancellation", "return", "warranty", "guarantee", "legal", "compliance",
            "gdpr", "data protection", "security", "cookie", "terms of service",
            "user agreement", "intellectual property", "trademark", "patent",
        ],
        Intent.MARKET: [
            "market", "price", "cost", "rate", "selling", "buy", "trade",
            "mandi", "msp", "minimum support price", "demand", "supply",
            "trend", "forecast", "prediction", "analytics", "chart", "graph",
            "historical", "current price", "wholesale", "retail", "import", "export",
            "profit", "loss", "income", "revenue", "business", "contract",
            "auction", "bid", "quotation", "quote",
        ],
        Intent.APP_NAVIGATION: [
            "how to", "how do i", "where is", "find", "search", "navigate",
            "page", "menu", "button", "feature", "function", "use", "login",
            "register", "signup", "sign in", "password", "profile", "settings",
            "notification", "alert", "update", "version", "app", "mobile",
            "dashboard", "home", "crop plan", "weather", "irrigation",
            "disease", "record", "report", "analytics", "export", "download",
        ],
    }

    # UI action keywords
    ACTION_KEYWORDS: Dict[str, List[str]] = {
        "market": ["market price", "mandi", "sell", "buy", "trade"],
        "weather": ["weather", "forecast", "rain", "temperature", "humidity"],
        "crop": ["crop", "plant", "seed", " cultivation"],
        "policy": ["policy", "scheme", "subsidy", "government"],
        "company": ["about", "contact", "company"],
        "support": ["help", "support", "issue", "problem", "error"],
        "profile": ["profile", "account", "settings", "preference"],
    }

    def __init__(self, llm_service=None):
        """
        Initialize the intent classifier.

        Args:
            llm_service: Optional LLM service for advanced classification
        """
        self.llm_service = llm_service

    def classify(self, query: str) -> IntentClassification:
        """
        Classify a user query into intent.

        Args:
            query: User query text

        Returns:
            IntentClassification with intent, confidence, keywords, etc.
        """
        query_lower = query.lower()

        # Extract keywords
        keywords = self._extract_keywords(query_lower)

        # Check for agriculture restriction
        if self._is_unrelated(query_lower):
            return IntentClassification(
                intent=Intent.UNRELATED,
                confidence=0.95,
                keywords=keywords,
                sub_intents=[],
                entities={},
            )

        # Score each intent
        intent_scores = self._score_intents(query_lower, keywords)

        # Determine primary intent
        primary_intent, primary_confidence = max(
            intent_scores.items(),
            key=lambda x: x[1]
        )

        # Check for mixed intent
        top_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
        if len(top_intents) >= 2 and top_intents[1][1] > 0.3:
            primary_intent = Intent.MIXED
            primary_confidence = (primary_confidence + top_intents[1][1]) / 2

        # Extract entities
        entities = self._extract_entities(query_lower)

        # Determine sub-intents
        sub_intents = self._determine_sub_intents(query_lower, keywords)

        return IntentClassification(
            intent=primary_intent,
            confidence=primary_confidence,
            keywords=keywords,
            sub_intents=sub_intents,
            entities=entities,
        )

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract keywords from query."""
        keywords = []
        all_patterns = []
        for patterns in self.KEYWORD_PATTERNS.values():
            all_patterns.extend(patterns)

        for pattern in all_patterns:
            if pattern in query:
                keywords.append(pattern)

        return keywords

    def _score_intents(self, query: str, keywords: List[str]) -> Dict[Intent, float]:
        """Score each intent based on keyword matching."""
        scores = {intent: 0.0 for intent in Intent}

        for intent, patterns in self.KEYWORD_PATTERNS.items():
            for pattern in patterns:
                if pattern in query:
                    # Weight multi-word patterns higher
                    weight = len(pattern.split()) * 0.1
                    scores[intent] += 0.1 + weight

        # Normalize scores
        max_score = max(scores.values()) if scores.values() else 1.0
        if max_score > 0:
            scores = {k: v / (max_score + 0.1) for k, v in scores.items()}

        # Boost market queries with location
        if any(loc in query for loc in ["coimbatore", "chennai", "delhi", "bangalore", "in"]):
            if "price" in query or "market" in query or "cost" in query:
                scores[Intent.MARKET] += 0.3

        return scores

    def _is_unrelated(self, query: str) -> bool:
        """Check if query is unrelated to allowed domains."""
        unrelated_keywords = [
            "movie", "film", "cinema", "actor", "actress",
            "politics", "election", "party", "government (non-agri)",
            "gaming", "video game", "playstation", "xbox",
            "sports", "football", "cricket", "match",
            "music", "song", "album", "concert",
            "programming", "code", "developer", "software (non-agri)",
            "news", "headline", "article",
            "recipe", "cook", "food (non-agri)",
            "travel", "tourism", "hotel", "flight",
            "fashion", "clothing", "dress",
        ]

        # Check if query contains unrelated keywords AND no agriculture keywords
        has_unrelated = any(kw in query for kw in unrelated_keywords)
        has_related = any(
            kw in query
            for patterns in self.KEYWORD_PATTERNS.values()
            for kw in patterns
        )

        return has_unrelated and not has_related

    def _extract_entities(self, query: str) -> Dict[str, str]:
        """Extract named entities from query."""
        entities = {}

        # Location patterns (Indian cities/states)
        locations = [
            "coimbatore", "chennai", "delhi", "bangalore", "mumbai", "hyderabad",
            "kolkata", "pune", "ahmedabad", "jaipur", "lucknow", "kerala",
            "tamil nadu", "karnataka", "maharashtra", "punjab", "haryana",
            "uttar pradesh", "west bengal", "andhra pradesh", "telangana",
        ]
        for loc in locations:
            if loc in query:
                entities["location"] = loc
                break

        # Crop entities
        crops = [
            "rice", "wheat", "cotton", "sugarcane", "tomato", "onion", "potato",
            "brinjal", "okra", "cabbage", "cauliflower", "maize", "millets",
            "paddy", "bajra", "jowar", "ragi", "pulses", "gram", "lentils",
        ]
        for crop in crops:
            if crop in query:
                entities["crop"] = crop
                break

        # Time expressions
        if any(t in query for t in ["today", "tomorrow", "week", "month", "season"]):
            entities["time"] = "current"

        return entities

    def _determine_sub_intents(self, query: str, keywords: List[str]) -> List[str]:
        """Determine sub-intents from keywords."""
        sub_intents = []

        if "disease" in query or "pest" in query:
            sub_intents.append("disease_pest")
        if "fertilizer" in query or "nutrient" in query:
            sub_intents.append("fertilizer_nutrient")
        if "irrigation" in query or "water" in query:
            sub_intents.append("irrigation_water")
        if "government scheme" in query or "subsidy" in query:
            sub_intents.append("government_scheme")
        if "market price" in query or "selling" in query:
            sub_intents.append("selling_strategy")

        return sub_intents

    def get_target_collections(self, intent: Intent) -> List[str]:
        """Get target collections for an intent."""
        collection_mapping = {
            Intent.AGRICULTURE: ["agriculture"],
            Intent.COMPANY: ["company"],
            Intent.POLICY: ["company"],
            Intent.MARKET: ["agriculture", "company"],  # Market data + company market services
            Intent.APP_NAVIGATION: ["company"],
            Intent.MIXED: ["agriculture", "company"],
            Intent.GENERAL_CONVERSATION: ["agriculture", "company"],
            Intent.UNRELATED: [],
        }
        return collection_mapping.get(intent, ["agriculture"])


def create_intent_classifier(llm_service=None) -> IntentClassifier:
    """Factory function to create an intent classifier."""
    return IntentClassifier(llm_service=llm_service)