"""
Action Generator Service
Generates UI actions based on user intent and query analysis.
"""

import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ActionType(str, Enum):
    """Supported UI action types."""
    OPEN_PAGE = "OpenPage"
    SEARCH_MARKET = "SearchMarket"
    NAVIGATE = "Navigate"
    OPEN_CROP = "OpenCrop"
    OPEN_POLICY = "OpenPolicy"
    OPEN_COMPANY_INFO = "OpenCompanyInfo"
    OPEN_WEATHER = "OpenWeather"
    OPEN_MARKETPLACE = "OpenMarketplace"
    OPEN_PROFILE = "OpenProfile"
    OPEN_SUPPORT = "OpenSupport"
    SHOW_ANALYTICS = "ShowAnalytics"
    HIGHLIGHT_SECTION = "HighlightSection"
    DISPLAY_CHART = "DisplayChart"


@dataclass
class UIAction:
    """A UI action to be performed."""
    type: ActionType
    page: Optional[str] = None
    parameters: Dict = None
    description: str = ""

    def to_dict(self) -> Dict:
        """Convert to dictionary format."""
        return {
            "type": self.type.value,
            "page": self.page,
            "parameters": self.parameters or {},
            "description": self.description,
        }


class ActionGenerator:
    """Generates UI actions based on intent and query."""

    # Page mapping
    PAGE_MAPPING = {
        "weather": "/weather",
        "market": "/market",
        "crops": "/crops",
        "disease": "/disease",
        "irrigation": "/irrigation",
        "profile": "/profile",
        "settings": "/settings",
        "support": "/support",
        "policy": "/policy",
        "government_scheme": "/government-schemes",
        "company": "/about",
        "orders": "/orders",
        "home": "/",
    }

    def __init__(self):
        """Initialize action generator."""
        self.action_patterns = self._build_action_patterns()

    def _build_action_patterns(self) -> Dict[str, Dict]:
        """Build patterns for action detection."""
        return {
            "weather": {
                "keywords": ["weather", "forecast", "rain", "temperature", "humidity", "monsoon"],
                "action": ActionType.OPEN_WEATHER,
                "page": "weather",
            },
            "market": {
                "keywords": ["market", "price", "cost", "selling", "mandi", "trend", "profit"],
                "action": ActionType.SEARCH_MARKET,
                "page": "market",
            },
            "crop": {
                "keywords": ["crop", "plant", "seed", "cultivation", "grow", "harvest"],
                "action": ActionType.OPEN_CROP,
                "page": "crops",
            },
            "disease": {
                "keywords": ["disease", "pest", "infection", "treatment", "cure"],
                "action": ActionType.OPEN_PAGE,
                "page": "disease",
            },
            "irrigation": {
                "keywords": ["irrigation", "water", "drip", "sprinkler", " irrigation"],
                "action": ActionType.OPEN_PAGE,
                "page": "irrigation",
            },
            "policy": {
                "keywords": ["policy", "terms", "privacy", "agreement", "refund"],
                "action": ActionType.OPEN_POLICY,
                "page": "policy",
            },
            "scheme": {
                "keywords": ["scheme", "subsidy", "government", "kisan", "pm-kisan", "insurance"],
                "action": ActionType.OPEN_PAGE,
                "page": "government_scheme",
            },
            "company": {
                "keywords": ["about", "company", "contact", "team", "mission"],
                "action": ActionType.OPEN_COMPANY_INFO,
                "page": "company",
            },
            "support": {
                "keywords": ["help", "support", "issue", "problem", "error", "contact"],
                "action": ActionType.OPEN_SUPPORT,
                "page": "support",
            },
            "profile": {
                "keywords": ["profile", "account", "settings", "preference"],
                "action": ActionType.OPEN_PROFILE,
                "page": "profile",
            },
        }

    def generate_actions(
        self,
        query: str,
        intent: str,
        entities: Dict[str, str] = None,
        context: Dict = None,
    ) -> List[UIAction]:
        """
        Generate UI actions based on query and intent.

        Args:
            query: User query
            intent: Classified intent
            entities: Extracted entities
            context: Additional context

        Returns:
            List of UIAction objects
        """
        query_lower = query.lower()
        entities = entities or {}
        context = context or {}
        actions = []

        # Check for market query with location/crop
        if "market" in intent or any(kw in query_lower for kw in ["price", "market", "selling"]):
            if entities.get("location") or entities.get("crop"):
                actions.append(UIAction(
                    type=ActionType.SEARCH_MARKET,
                    page="market",
                    parameters={
                        "location": entities.get("location", ""),
                        "crop": entities.get("crop", ""),
                    },
                    description=f"Search market for {entities.get('crop', 'crops')} in {entities.get('location', 'selected location')}",
                ))
            else:
                actions.append(UIAction(
                    type=ActionType.OPEN_PAGE,
                    page="market",
                    description="Open market page",
                ))

        # Weather-related queries
        if any(kw in query_lower for kw in ["weather", "forecast", "rain"]):
            actions.append(UIAction(
                type=ActionType.OPEN_WEATHER,
                page="weather",
                parameters=entities.get("location", {}),
                description=f"Open weather for {entities.get('location', 'your location')}",
            ))

        # Government scheme queries
        if any(kw in query_lower for kw in ["scheme", "subsidy", "insurance", "government"]):
            actions.append(UIAction(
                type=ActionType.OPEN_PAGE,
                page="government_scheme",
                parameters={"highlight": "crop_insurance"} if "insurance" in query_lower else {},
                description="Open government schemes page",
            ))

        # Crop-related queries
        if any(kw in query_lower for kw in ["crop", "plant", "seed", "grow"]):
            crop_name = entities.get("crop", "")
            if crop_name:
                actions.append(UIAction(
                    type=ActionType.OPEN_CROP,
                    page="crops",
                    parameters={"crop": crop_name},
                    description=f"Open crop details for {crop_name}",
                ))
            else:
                actions.append(UIAction(
                    type=ActionType.OPEN_PAGE,
                    page="crops",
                    description="Open crops page",
                ))

        # Company/policy queries
        if "company" in intent or "policy" in intent:
            if "policy" in query_lower:
                actions.append(UIAction(
                    type=ActionType.OPEN_POLICY,
                    page="policy",
                    description="Open policy page",
                ))
            else:
                actions.append(UIAction(
                    type=ActionType.OPEN_COMPANY_INFO,
                    page="company",
                    description="Open company information",
                ))

        # Support queries
        if any(kw in query_lower for kw in ["help", "support", "issue", "problem"]):
            actions.append(UIAction(
                type=ActionType.OPEN_SUPPORT,
                page="support",
                description="Open support page",
            ))

        # Profile queries
        if any(kw in query_lower for kw in ["profile", "account", "settings"]):
            actions.append(UIAction(
                type=ActionType.OPEN_PROFILE,
                page="profile",
                description="Open profile page",
            ))

        # If no specific action found, add default navigation
        if not actions:
            actions.append(UIAction(
                type=ActionType.NAVIGATE,
                page="home",
                description="Go to home page",
            ))

        return actions

    def get_page_url(self, page: str) -> str:
        """Get the URL for a page."""
        return self.PAGE_MAPPING.get(page, f"/{page}")

    def should_show_analytics(self, query: str) -> bool:
        """Check if analytics should be shown."""
        analytics_keywords = ["trend", "analytics", "chart", "graph", "historical", "prediction"]
        return any(kw in query.lower() for kw in analytics_keywords)


def create_action_generator() -> ActionGenerator:
    """Factory function to create action generator."""
    return ActionGenerator()