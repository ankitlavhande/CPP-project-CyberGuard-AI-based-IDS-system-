import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff

from logger_store import add_log, get_logs
from routes.logs import router as logs_router
from routes.predict import router as predict_router
from routes.metrics import router as metrics_router

# Import your feature extractor + model
from model_loader import model, scaler, encoder, feature_columns
from live_feature_extractor import process_packet, flows  # your enhanced extractor

# =========================
# APP INIT
# =========================

app = FastAPI(title="AI CyberGuard Backend")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# INCLUDE ROUTERS
# =========================

app.include_router(predict_router)
app.include_router(metrics_router)
app.include_router(logs_router)

# =========================
# LIVE MONITORING STATE
# =========================

live_running = False
live_thread = None

live_stats = {
    "total_flows": 0,
    "attack_count": 0,
    "distribution": {},
    "last_prediction": None
}

# =========================
# LIVE CLASSIFICATION LOGIC
# =========================

def classify_flow(feature_dict):
    """
    Takes extracted feature dict,
    aligns with training features,
    runs prediction,
    updates live_stats.
    """

    global live_stats

    # Ensure correct feature order
    feature_vector = [feature_dict.get(col, 0) for col in feature_columns]

    # Scale
    X_scaled = scaler.transform([feature_vector])

    # Predict
    prediction_encoded = model.predict(X_scaled)
    prediction_label = encoder.inverse_transform(prediction_encoded)[0]

    # Update stats
    live_stats["total_flows"] += 1
    live_stats["last_prediction"] = prediction_label

    if prediction_label != "BENIGN":
        live_stats["attack_count"] += 1

    if prediction_label not in live_stats["distribution"]:
        live_stats["distribution"][prediction_label] = 0

    live_stats["distribution"][prediction_label] += 1

    add_log(f"Live Flow Classified: {prediction_label}")


# =========================
# BACKGROUND SNIFFER
# =========================

def packet_callback(packet):
    if not live_running:
        return

    feature_data = process_packet(packet)

    if feature_data:
        classify_flow(feature_data)


def start_sniffing():
    sniff(prn=packet_callback, store=False)


# =========================
# LIVE CONTROL ENDPOINTS
# =========================

@app.post("/start-live")
def start_live_monitoring():
    global live_running, live_thread

    if live_running:
        return {"status": "Live monitoring already running"}

    live_running = True
    live_thread = threading.Thread(target=start_sniffing, daemon=True)
    live_thread.start()

    add_log("Live monitoring started")

    return {"status": "Live monitoring started"}


@app.post("/stop-live")
def stop_live_monitoring():
    global live_running

    if not live_running:
        return {"status": "Live monitoring not running"}

    live_running = False
    add_log("Live monitoring stopped")

    return {"status": "Live monitoring stopped"}


@app.get("/live-status")
def get_live_status():
    return live_stats


# =========================
# ROOT
# =========================

@app.get("/logs")
def fetch_logs():
    return get_logs()

@app.get("/")
def root():
    return {"message": "Backend running"}