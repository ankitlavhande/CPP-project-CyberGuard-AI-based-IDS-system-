import os
import json
from fastapi import APIRouter

router = APIRouter()

# Get absolute path to project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")

@router.get("/metrics")
def get_metrics():
    try:
        with open(METRICS_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "error": "metrics.json not found",
            "accuracy": 0,
            "weighted_f1": 0,
            "macro_f1": 0,
            "precision": 0,
            "recall": 0
        }
