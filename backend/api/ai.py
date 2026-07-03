from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os

# Ensure ml_modules path is discoverable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../ml_modules')))
from phishing_detection.mock_phishing_model import phishing_model
from network_intrusion.mock_network_model import network_model

router = APIRouter()

class URLRequest(BaseModel):
    url: str

class NetworkRequest(BaseModel):
    features: list[float]

@router.post("/analyze-url")
async def analyze_url(req: URLRequest):
    label, conf, risk = phishing_model.predict_url(req.url)
    return {"label": label, "confidence": conf, "risk_score": risk}

@router.post("/analyze-network")
async def analyze_network(req: NetworkRequest):
    label, conf, risk = network_model.predict(req.features)
    return {"label": label, "confidence": conf, "risk_score": risk}
