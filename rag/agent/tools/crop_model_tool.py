"""
Crop Model Tool
Wraps the existing crop prediction model from the Express backend.
"""

import logging
from typing import Optional, Any
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from langchain_core.callbacks import CallbackManagerForToolRun
import httpx

logger = logging.getLogger(__name__)


class CropPredictionInput(BaseModel):
    """Input schema for crop prediction tool."""
    nitrogen: float = Field(description="Nitrogen content in soil (kg/ha)")
    phosphorus: float = Field(description="Phosphorus content in soil (kg/ha)")
    potassium: float = Field(description="Potassium content in soil (kg/ha)")
    temperature: float = Field(description="Temperature in Celsius")
    humidity: float = Field(description="Humidity percentage")
    ph: float = Field(description="Soil pH value")
    rainfall: float = Field(description="Annual rainfall (mm)")
    soil_type: Optional[str] = Field(None, description="Type of soil (optional)")
    acreage: Optional[float] = Field(None, description="Farm acreage (optional)")


class CropTool(BaseTool):
    """Tool for crop recommendation and yield prediction."""

    name: str = "crop_prediction"
    description: str = (
        "Useful for predicting suitable crops based on soil and climate conditions, "
        "estimating crop yields, and getting agricultural recommendations. "
        "Use this when the user provides soil test results (NPK values), climate data, "
        "or asks for crop recommendations for their farm."
    )
    args_schema: type[BaseModel] = CropPredictionInput
    backend_url: str = "http://localhost:3002"

    def __init__(self, backend_url: str = "http://localhost:3002", **kwargs):
        super().__init__(backend_url=backend_url, **kwargs)

    def _run(
        self,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        soil_type: Optional[str] = None,
        acreage: Optional[float] = None,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Execute crop prediction."""
        try:
            payload = {
                "nitrogen": nitrogen,
                "phosphorus": phosphorus,
                "potassium": potassium,
                "temperature": temperature,
                "humidity": humidity,
                "ph": ph,
                "rainfall": rainfall,
            }

            if soil_type:
                payload["soil_type"] = soil_type
            if acreage:
                payload["acreage"] = acreage

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.backend_url}/api/predict/crop",
                    json=payload,
                )

            if response.status_code != 200:
                return f"Crop prediction failed: {response.text}"

            data = response.json()

            # Format response
            result = f"Recommended Crop: {data.get('recommended_crop', 'N/A')}\n"
            result += f"Confidence: {data.get('confidence', 0)}%\n"
            result += f"Reason: {data.get('reason', 'N/A')}\n"

            if data.get('alternatives'):
                result += "\nAlternative crops:\n"
                for alt in data['alternatives']:
                    result += f"- {alt['crop']} ({alt['confidence']}%)\n"

            if data.get('recommendations'):
                result += "\nFull Recommendations:\n"
                for rec in data['recommendations'][:3]:
                    result += f"- {rec['crop']}: {rec['reason']}\n"

            return result

        except httpx.ConnectError:
            return "Cannot connect to backend. Ensure Express backend is running on port 3002."
        except Exception as e:
            logger.error(f"Crop tool error: {e}")
            return f"Error predicting crop: {str(e)}"


def create_crop_tool(backend_url: str = "http://localhost:3002") -> CropTool:
    """Factory function to create crop prediction tool."""
    return CropTool(backend_url=backend_url)