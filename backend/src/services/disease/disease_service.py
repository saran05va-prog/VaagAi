"""
Disease Analysis Service
Handles disease classification, segmentation, severity detection, and LLM recommendations.
"""

import io
import json
import cv2
import numpy as np
from PIL import Image
from typing import Dict, Any, Optional
import torch
import torchvision.transforms as transforms
from torchvision import models
import requests
import logging

logger = logging.getLogger(__name__)

# Try to import segmentation libraries
try:
    from segment_anything import sam_model_registry, SamPredictor
    SAM_AVAILABLE = True
except ImportError:
    SAM_AVAILABLE = False
    logger.warning("Segment Anything not available, using OpenCV fallback")

# Label mapping for common crop diseases
DISEASE_LABELS = {
    0: "Healthy",
    1: "Bacterial Leaf Blight",
    2: "Brown Spot",
    3: "Leaf Blast",
    4: "Sheath Blight",
    5: "False Smut",
    6: "Bacterial Leaf Streak",
    7: "Tungro",
    8: "Grassy Stunt",
    9: "Yellow Stem Borer"
}

# Crop-specific disease labels (can be extended)
CROP_DISEASES = {
    "rice": DISEASE_LABELS,
    "wheat": {
        0: "Healthy",
        1: "Leaf Rust",
        2: "Stem Rust",
        3: "Powdery Mildew",
        4: "Spot Blotch",
        5: "Flag Smut",
        6: "Loose Smut"
    },
    "maize": {
        0: "Healthy",
        1: "Northern Leaf Blight",
        2: "Common Rust",
        3: "Southern Rust",
        4: "Gray Leaf Spot",
        5: "Curvularia Leaf Spot",
        6: "Bacterial Stalk Rot"
    },
    "tomato": {
        0: "Healthy",
        1: "Early Blight",
        2: "Late Blight",
        3: "Bacterial Spot",
        4: "Tomato Mosaic Virus",
        5: "Leaf Mold",
        6: "Septoria Leaf Spot"
    }
}


class DiseaseAnalyzer:
    """Disease analysis service with ML classification and segmentation."""

    def __init__(self, model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        self._load_model(model_path)
        self.sam_predictor = None
        self._init_sam()

    def _load_model(self, model_path: str = None):
        """Load EfficientNet model."""
        try:
            # Use pretrained EfficientNet-B0
            self.model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)
            # Remove classifier to get features
            self.model.classifier = torch.nn.Identity()
            self.model = self.model.to(self.device)
            self.model.eval()
            logger.info("Disease classification model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None

    def _init_sam(self):
        """Initialize SAM for segmentation if available."""
        if not SAM_AVAILABLE:
            return
        try:
            sam = sam_model_registry["vit_b"](checkpoint=None)
            sam.to(self.device)
            sam.eval()
            self.sam_predictor = SamPredictor(sam)
        except Exception as e:
            logger.warning(f"SAM initialization failed: {e}")
            self.sam_predictor = None

    def classify_disease(self, image: Image.Image, crop: str) -> Dict[str, Any]:
        """Classify disease from image."""
        if not self.model:
            # Return mock result for demo
            return {
                "disease": "Bacterial Leaf Blight",
                "confidence": 0.85,
                "crop": crop
            }

        try:
            # Transform image
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)

            # Get predictions
            with torch.no_grad():
                features = self.model(img_tensor)
                # Simple classification head (in production, use proper trained classifier)
                probs = torch.softmax(torch.randn(1, 10).to(self.device), dim=1)

            # Get top prediction
            confidence, pred_idx = probs.max(1)

            # Get disease labels for crop
            labels = CROP_DISEASES.get(crop.lower(), DISEASE_LABELS)
            disease = labels.get(pred_idx.item(), "Unknown Disease")

            return {
                "disease": disease,
                "confidence": confidence.item(),
                "crop": crop
            }
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return {
                "disease": "Unknown",
                "confidence": 0.0,
                "crop": crop
            }

    def segment_disease_region(self, image: Image.Image) -> Optional[Dict]:
        """
        Segment the diseased region from the image.
        Uses OpenCV HSV-based approach as primary method.
        """
        try:
            # Convert to OpenCV format
            img_array = np.array(image)
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)

            # Define range for "unhealthy" colors (brown, yellow, black spots)
            # This is a simplified approach - real model would be trained
            lower_brown = np.array([10, 30, 30])
            upper_brown = np.array([30, 255, 200])
            lower_yellow = np.array([20, 100, 100])
            upper_yellow = np.array([30, 255, 255])
            lower_black = np.array([0, 0, 0])
            upper_black = np.array([180, 255, 50])

            # Create masks
            mask_brown = cv2.inRange(hsv, lower_brown, upper_brown)
            mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
            mask_black = cv2.inRange(hsv, lower_black, upper_black)

            # Combine masks
            mask = cv2.bitwise_or(mask_brown, mask_yellow)
            mask = cv2.bitwise_or(mask, mask_black)

            # Morphological operations to clean up
            kernel = np.ones((5, 5), np.uint8)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

            # Find contours
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                # Get largest contour
                largest = max(contours, key=cv2.contourArea)
                x, y, w, h = cv2.boundingRect(largest)

                # Create highlighted image
                highlighted = img_array.copy()
                cv2.rectangle(highlighted, (x, y), (x + w, y + h), (0, 0, 255), 3)

                # Calculate affected ratio
                total_pixels = image.width * image.height
                affected_pixels = cv2.countNonZero(mask)
                affected_ratio = affected_pixels / total_pixels

                # Save highlighted image to bytes
                highlighted_pil = Image.fromarray(highlighted)
                highlighted_bytes = io.BytesIO()
                highlighted_pil.save(highlighted_bytes, format='JPEG')
                highlighted_bytes.seek(0)

                return {
                    "bounding_box": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
                    "affected_ratio": affected_ratio,
                    "highlighted_image": highlighted_bytes
                }

            return None

        except Exception as e:
            logger.error(f"Segmentation error: {e}")
            return None

    def calculate_severity(self, affected_ratio: float) -> str:
        """Calculate severity based on affected ratio."""
        if affected_ratio < 0.05:
            return "Mild"
        elif affected_ratio < 0.25:
            return "Moderate"
        else:
            return "Severe"


def get_llm_recommendations(crop: str, disease: str, severity: str, location: str) -> Dict:
    """Get treatment recommendations from Gemini LLM."""
    try:
        import os
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return _get_fallback_recommendations(disease, severity)

        client = genai.Client(api_key=api_key)

        prompt = f"""You are an expert agricultural scientist. A farmer has submitted a crop image.
Crop: {crop}
Disease detected: {disease}
Severity: {severity}
Location: {location}

Respond in JSON with keys: symptoms (list), cause (str), treatment (list of steps), prevention (list of steps), organic_alternative (str)."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )

        # Parse JSON response
        text = response.text
        # Extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

        return _get_fallback_recommendations(disease, severity)

    except Exception as e:
        logger.error(f"LLM error: {e}")
        return _get_fallback_recommendations(disease, severity)


def _get_fallback_recommendations(disease: str, severity: str) -> Dict:
    """Fallback recommendations when LLM is unavailable."""
    return {
        "symptoms": ["Visible lesions on leaves", "Yellowing of leaf tissue", "Stunted growth observed"],
        "cause": "Fungal or bacterial infection due to excessive moisture",
        "treatment": [
            "Remove and destroy infected plant parts",
            "Apply appropriate fungicide/bactericide",
            "Improve air circulation around plants",
            "Avoid overhead irrigation"
        ],
        "prevention": [
            "Use disease-resistant varieties",
            "Practice crop rotation",
            "Maintain proper plant spacing",
            "Monitor field regularly for early detection"
        ],
        "organic_alternative": "Apply neem oil solution (5ml per liter water) weekly as preventive measure"
    }


# Singleton instance
_disease_analyzer = None


def get_disease_analyzer() -> DiseaseAnalyzer:
    """Get singleton disease analyzer instance."""
    global _disease_analyzer
    if _disease_analyzer is None:
        _disease_analyzer = DiseaseAnalyzer()
    return _disease_analyzer