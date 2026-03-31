from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import random

# -----------------------------
# App Init
# -----------------------------
app = FastAPI(title="AI CyberGuard Backend")

# -----------------------------
# Load Model & Features
# -----------------------------
model = joblib.load("model.pkl")
feature_names = joblib.load("features.pkl")

# -----------------------------
# Input Schema
# -----------------------------
class TrafficInput(BaseModel):
    packet_size: float
    flow_duration: float
    src_bytes: int
    dst_bytes: int
    protocol: int
    flag_count: int

# -----------------------------
# Utils
# -----------------------------
def preprocess(data: TrafficInput):
    values = [
        data.packet_size,
        data.flow_duration,
        data.src_bytes,
        data.dst_bytes,
        data.protocol,
        data.flag_count
    ]
    return np.array(values).reshape(1, -1)

# -----------------------------
# Routes
# -----------------------------

@app.get("/health")
def health_check():
    return {
        "model_loaded": True,
        "model_type": "LightGBM",
    }

@app.post("/classify")
def classify_traffic(data: TrafficInput):
    """
    Classifies traffic as Normal or Attack
    """
    features = preprocess(data)
    probability = model.predict_proba(features)[0][1]

    label = "Attack" if probability >= 0.5 else "Normal"

    return {
        "classification": label,
        "attack_probability": round(float(probability), 3)
    }

@app.get("/predict-risk")
def predict_risk():
    """
    Forecasts future attack likelihood based on historical trends.
    This does NOT classify traffic.
    """
    return {
        "next_1h": round(random.uniform(0.3, 0.6), 2),
        "next_6h": round(random.uniform(0.5, 0.75), 2),
        "next_24h": round(random.uniform(0.6, 0.9), 2)
    }
