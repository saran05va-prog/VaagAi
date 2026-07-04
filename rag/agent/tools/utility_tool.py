"""
Utility Tool
Provides unit conversions and fertilizer dosage calculations.
"""

import logging
from typing import Optional, Union
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun

logger = logging.getLogger(__name__)


class FertilizerCalculationInput(BaseModel):
    """Input schema for fertilizer calculation."""
    crop: str = Field(description="Crop name (e.g., rice, wheat, maize)")
    area: float = Field(description="Area in acres")
    method: str = Field(description="Calculation method: dose or total")


class UnitConversionInput(BaseModel):
    """Input schema for unit conversion."""
    value: float = Field(description="Value to convert")
    from_unit: str = Field(description="Source unit (acre, hectare, kg, quintal)")
    to_unit: str = Field(description="Target unit")


class UtilityTool(BaseTool):
    """Tool for utility calculations like fertilizer dosage and unit conversion."""

    name: str = "farm_utility"
    description: str = (
        "Useful for calculating fertilizer dosages, converting between agricultural units "
        "(acres to hectares, kg to quintals), and answering general farm calculations. "
        "Use this when the user asks about converting units or calculating fertilizer requirements."
    )

    def _run(
        self,
        calculation_type: str = "fertilizer",
        crop: Optional[str] = None,
        area: Optional[float] = None,
        value: Optional[float] = None,
        from_unit: Optional[str] = None,
        to_unit: Optional[str] = None,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Execute utility calculations."""
        try:
            if calculation_type == "fertilizer":
                return self._calculate_fertilizer(crop, area)
            elif calculation_type == "conversion":
                return self._convert_units(value, from_unit, to_unit)
            else:
                return "Unknown calculation type. Use 'fertilizer' or 'conversion'."
        except Exception as e:
            logger.error(f"Utility tool error: {e}")
            return f"Error calculating: {str(e)}"

    def _calculate_fertilizer(self, crop: Optional[str], area: Optional[float]) -> str:
        """Calculate fertilizer dosage for a crop."""
        if not crop or not area:
            return "Please provide both crop name and area in acres."

        crop = crop.lower()

        # NPK recommendations (kg per acre)
        recommendations = {
            "rice": {"N": 60, "P": 30, "K": 30},
            "wheat": {"N": 40, "P": 20, "K": 20},
            "maize": {"N": 50, "P": 25, "K": 25},
            "cotton": {"N": 50, "P": 25, "K": 25},
            "sugarcane": {"N": 70, "P": 35, "K": 35},
            "groundnut": {"N": 20, "P": 40, "K": 20},
            "mustard": {"N": 30, "P": 25, "K": 15},
            "potato": {"N": 60, "P": 30, "K": 50},
            "onion": {"N": 40, "P": 25, "K": 30},
            "tomato": {"N": 50, "P": 30, "K": 40},
        }

        if crop not in recommendations:
            available = ", ".join(recommendations.keys())
            return f"Unknown crop '{crop}'. Available crops: {available}"

        npk = recommendations[crop]
        n_total = npk["N"] * area
        p_total = npk["P"] * area
        k_total = npk["K"] * area

        # Urea (46% N), DAP (18% N, 46% P2O5), MOP (60% K2O)
        urea = (n_total / 46) * 100
        dap = (p_total / 46) * 100
        mop = (k_total / 60) * 100

        return (
            f"Fertilizer recommendations for {crop.title()} on {area} acres:\n"
            f"\n"
            f"Nutrients required:\n"
            f"- Nitrogen (N): {n_total:.1f} kg\n"
            f"- Phosphorus (P2O5): {p_total:.1f} kg\n"
            f"- Potassium (K2O): {k_total:.1f} kg\n"
            f"\n"
            f"Fertilizer amounts:\n"
            f"- Urea (46% N): {urea:.1f} kg\n"
            f"- DAP (18% N, 46% P2O5): {dap:.1f} kg\n"
            f"- MOP (60% K2O): {mop:.1f} kg\n"
            f"\n"
            f"Split application recommended for better efficiency."
        )

    def _convert_units(
        self,
        value: Optional[float],
        from_unit: Optional[str],
        to_unit: Optional[str],
    ) -> str:
        """Convert between agricultural units."""
        if not all([value, from_unit, to_unit]):
            return "Please provide value, from_unit, and to_unit."

        from_unit = from_unit.lower()
        to_unit = to_unit.lower()

        # Conversions
        conversions = {
            ("acre", "hectare"): 0.404686,
            ("hectare", "acre"): 2.47105,
            ("kg", "quintal"): 0.01,
            ("quintal", "kg"): 100,
            ("kg", "tonne"): 0.001,
            ("tonne", "kg"): 1000,
            ("acre", "sqft"): 43560,
            ("hectare", "sqft"): 107639,
        }

        key = (from_unit, to_unit)
        if key in conversions:
            result = value * conversions[key]
            return f"{value} {from_unit} = {result:.2f} {to_unit}"

        # Try reverse
        reverse_key = (to_unit, from_unit)
        if reverse_key in conversions:
            result = value / conversions[reverse_key]
            return f"{value} {from_unit} = {result:.2f} {to_unit}"

        available = ", ".join([f"{a}→{b}" for a, b in conversions.keys()])
        return f"Conversion not supported. Available conversions: {available}"


def create_utility_tool() -> UtilityTool:
    """Factory function to create utility tool."""
    return UtilityTool()