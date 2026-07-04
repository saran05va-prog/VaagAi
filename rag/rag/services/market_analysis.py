"""
Market Analysis Service
Provides market data analysis and insights.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class MarketData:
    """Market data for a specific crop/location."""
    crop: str
    location: str
    current_price: float
    price_unit: str
    trend: str  # "up", "down", "stable"
    demand: str  # "high", "medium", "low"
    supply: str  # "high", "medium", "low"
    msp: Optional[float] = None
    last_updated: str = ""


@dataclass
class MarketAnalysis:
    """Complete market analysis result."""
    location: str
    crop: str
    current_prices: List[MarketData]
    trend_analysis: str
    demand_supply: Dict
    recommendations: List[str]
    risk_level: str  # "low", "medium", "high"
    selling_period: str
    additional_insights: str


class MarketAnalysisService:
    """Analyzes market data for crops and locations."""

    def __init__(
        self,
        groq_service=None,
        market_api_url: str = None,
        market_api_key: str = None,
    ):
        """
        Initialize market analysis service.

        Args:
            groq_service: Groq service for additional analysis
            market_api_url: External market API URL
            market_api_key: API key for market data
        """
        self.groq_service = groq_service
        self.market_api_url = market_api_url
        self.market_api_key = market_api_key

    async def analyze(
        self,
        location: str,
        crop: str = None,
        include_trend: bool = True,
    ) -> MarketAnalysis:
        """
        Analyze market for a location and optionally crop.

        Args:
            location: Location to analyze
            crop: Optional crop to focus on
            include_trend: Include trend analysis

        Returns:
            MarketAnalysis with comprehensive market data
        """
        # Fetch current market data
        market_data = await self._fetch_market_data(location, crop)

        # Get historical data
        historical_data = await self._fetch_historical_data(location, crop)

        # Analyze trends
        trend_analysis = self._analyze_trends(market_data, historical_data)

        # Get demand/supply analysis
        demand_supply = self._analyze_demand_supply(market_data)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            market_data, trend_analysis, demand_supply
        )

        # Determine risk level
        risk_level = self._determine_risk_level(market_data, demand_supply)

        # Suggest selling period
        selling_period = self._suggest_selling_period(crop, trend_analysis)

        # Get additional insights from Groq if available
        additional_insights = ""
        if self.groq_service:
            try:
                insights_prompt = f"""Based on current market data for {crop or 'crops'} in {location}:
- Current prices: {market_data}
- Trend: {trend_analysis}
- Demand: {demand_supply.get('demand', 'unknown')}
- Supply: {demand_supply.get('supply', 'unknown')}

Provide brief market insights (2-3 sentences in Tamil/English for Indian farmers)."""

                result = await self.groq_service.get_response(insights_prompt)
                additional_insights = result.content if hasattr(result, 'content') else str(result)
            except Exception as e:
                logger.error(f"Groq insights failed: {e}")

        return MarketAnalysis(
            location=location,
            crop=crop or "all",
            current_prices=market_data,
            trend_analysis=trend_analysis,
            demand_supply=demand_supply,
            recommendations=recommendations,
            risk_level=risk_level,
            selling_period=selling_period,
            additional_insights=additional_insights,
        )

    async def _fetch_market_data(
        self,
        location: str,
        crop: str = None,
    ) -> List[MarketData]:
        """Fetch current market data."""
        # In production, this would call actual market APIs
        # For now, return mock data structure
        return [
            MarketData(
                crop=crop or "Tomato",
                location=location,
                current_price=25.0,
                price_unit="kg",
                trend="up",
                demand="high",
                supply="medium",
                msp=None,
                last_updated="2024-01-15",
            )
        ]

    async def _fetch_historical_data(
        self,
        location: str,
        crop: str = None,
    ) -> Dict:
        """Fetch historical market data."""
        # Mock historical data
        return {
            "last_week": {"avg_price": 22.0},
            "last_month": {"avg_price": 20.0},
            "last_year": {"avg_price": 18.0},
        }

    def _analyze_trends(
        self,
        market_data: List[MarketData],
        historical_data: Dict,
    ) -> str:
        """Analyze price trends."""
        if not market_data:
            return "无法获取趋势数据"

        current = market_data[0]
        if current.trend == "up":
            return f"{current.crop}价格呈上涨趋势。建议适时出售以获得更好的利润。"
        elif current.trend == "down":
            return f"{current.crop}价格呈下降趋势。建议等待价格回升或考虑储存。"
        else:
            return f"{current.crop}价格保持稳定。"

    def _analyze_demand_supply(self, market_data: List[MarketData]) -> Dict:
        """Analyze demand and supply."""
        if not market_data:
            return {"demand": "unknown", "supply": "unknown"}

        current = market_data[0]
        return {
            "demand": current.demand,
            "supply": current.supply,
            "analysis": self._get_supply_demand_analysis(current.demand, current.supply),
        }

    def _get_supply_demand_analysis(self, demand: str, supply: str) -> str:
        """Get human-readable supply/demand analysis."""
        if demand == "high" and supply == "low":
            return "供不应求，价格看涨"
        elif demand == "low" and supply == "high":
            return "供过于求，价格看跌"
        elif demand == "high" and supply == "high":
            return "供需平衡，价格稳定"
        else:
            return "市场平稳"

    def _generate_recommendations(
        self,
        market_data: List[MarketData],
        trend_analysis: str,
        demand_supply: Dict,
    ) -> List[str]:
        """Generate selling/buying recommendations."""
        recommendations = []

        if not market_data:
            return ["无法获取推荐，请稍后再试"]

        current = market_data[0]

        # Price-based recommendations
        if current.trend == "up":
            recommendations.append("建议近期出售，价格正在上涨")
        elif current.trend == "down":
            recommendations.append("建议储存待价格回升")

        # Demand-based recommendations
        if current.demand == "high":
            recommendations.append("市场需求高，是出售的好时机")

        # Risk-based recommendations
        if demand_supply.get("demand") == "low" and demand_supply.get("supply") == "high":
            recommendations.append("市场风险较高，建议观望")

        return recommendations[:3]

    def _determine_risk_level(
        self,
        market_data: List[MarketData],
        demand_supply: Dict,
    ) -> str:
        """Determine market risk level."""
        if not market_data:
            return "unknown"

        current = market_data[0]

        # Simple risk calculation
        if current.demand == "high" and current.supply == "low":
            return "low"
        elif current.demand == "low" and current.supply == "high":
            return "high"
        elif current.trend == "down":
            return "medium"
        else:
            return "medium"

    def _suggest_selling_period(self, crop: str, trend_analysis: str) -> str:
        """Suggest optimal selling period."""
        if not crop:
            return "根据市场趋势决定"

        # Simple seasonal suggestions (in production, use actual data)
        if trend_analysis == "up":
            return "建议立即出售"
        elif trend_analysis == "down":
            return "建议等待2-4周"
        else:
            return "可以在1-2周内出售"

    def format_for_ui(self, analysis: MarketAnalysis) -> Dict:
        """Format analysis for UI display."""
        return {
            "location": analysis.location,
            "crop": analysis.crop,
            "current_price": f"₹{analysis.current_prices[0].current_price if analysis.current_prices else 0}/{analysis.current_prices[0].price_unit if analysis.current_prices else 'kg'}",
            "trend": analysis.trend_analysis,
            "demand": analysis.demand_supply.get("demand", "unknown"),
            "supply": analysis.demand_supply.get("supply", "unknown"),
            "recommendations": analysis.recommendations,
            "risk_level": analysis.risk_level,
            "selling_period": analysis.selling_period,
            "insights": analysis.additional_insights,
            "actions": [
                {
                    "type": "SearchMarket",
                    "page": "market",
                    "parameters": {
                        "location": analysis.location,
                        "crop": analysis.crop,
                    },
                }
            ],
        }


def create_market_analysis_service(
    groq_service=None,
    market_api_url: str = None,
    market_api_key: str = None,
) -> MarketAnalysisService:
    """Factory function to create market analysis service."""
    return MarketAnalysisService(
        groq_service=groq_service,
        market_api_url=market_api_url,
        market_api_key=market_api_key,
    )