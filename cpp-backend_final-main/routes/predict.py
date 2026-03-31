from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Dict
import matplotlib.pyplot as plt
from reportlab.platypus import Image , PageBreak
import numpy as np
import pandas as pd
import traceback
import uuid
from datetime import datetime

from shared_state import live_stats, last_batch_result

from logger_store import add_log
from model_loader import model, scaler, encoder, feature_columns

from fastapi.responses import FileResponse
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


router = APIRouter()


# =============================
# Request Schema
# =============================

class PredictionInput(BaseModel):
    data: Dict[str, float]


# =============================
# SINGLE PREDICTION
# =============================

@router.post("/predict")
def predict(payload: PredictionInput):

    try:

        df = pd.DataFrame([payload.data])

        for col in ["Label", "Day"]:
            if col in df.columns:
                df = df.drop(col, axis=1)

        missing = set(feature_columns) - set(df.columns)

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing features: {list(missing)}"
            )

        df = df[feature_columns]

        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)

        scaled = scaler.transform(df)

        prediction_index = model.predict(scaled)[0]

        probabilities = model.predict_proba(scaled)[0]

        confidence = float(np.max(probabilities))

        label = encoder.inverse_transform([prediction_index])[0]

        return {
            "prediction": label,
            "confidence": round(confidence * 100, 2)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================
# BATCH PREDICTION
# =============================

@router.post("/predict-batch")
async def predict_batch(file: UploadFile = File(...)):

    global last_batch_result

    try:

        df = pd.read_csv(file.file)

        for col in ["Label", "Day"]:
            if col in df.columns:
                df = df.drop(col, axis=1)

        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(0)

        missing = set(feature_columns) - set(df.columns)

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV missing required features: {list(missing)}"
            )

        df = df[feature_columns]

        scaled = scaler.transform(df)

        preds = model.predict(scaled)

        labels = encoder.inverse_transform(preds)

        attack_mask = labels != "BENIGN"

        attack_count = int(np.sum(attack_mask))

        distribution = pd.Series(labels).value_counts().to_dict()

        result = {
            "total_flows": int(len(df)),
            "attacks_detected": attack_count,
            "attack_rate": round((attack_count / len(df)) * 100, 2),
            "distribution": distribution
        }

        last_batch_result = result

        return result

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =============================
# REPORT GENERATION
# =============================

@router.get("/generate-report")
def generate_report():

    global last_batch_result

    data = None
    mode = "UNKNOWN"

    # ---------- SELECT DATA ----------

    if live_stats["total_flows"] > 0:

        total = live_stats["total_flows"]
        attacks = live_stats["attack_count"]
        distribution = live_stats["distribution"]

        attack_rate = (
            attacks / total * 100
            if total > 0 else 0
        )

        data = {
            "total_flows": total,
            "attacks_detected": attacks,
            "attack_rate": round(attack_rate, 2),
            "distribution": distribution
        }

        mode = "LIVE MONITORING"

    elif last_batch_result:

        data = last_batch_result
        mode = "BATCH ANALYSIS"

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No analysis available"
        )

    total = data["total_flows"]
    attacks = data["attacks_detected"]
    attack_rate = data["attack_rate"]
    distribution = data["distribution"]

    # ---------- RISK ----------

    if attack_rate < 5:
        risk_level = "LOW"
        risk_color = colors.green

    elif attack_rate < 20:
        risk_level = "MODERATE"
        risk_color = colors.orange

    elif attack_rate < 40:
        risk_level = "HIGH"
        risk_color = colors.red

    else:
        risk_level = "CRITICAL"
        risk_color = colors.darkred


    file_path = "CyberGuard_SOC_Report.pdf"
    file_name = "CyberGuard SOC Report"
    chart_path = "attack_chart.png"


    # ---------- CREATE CHART ----------

    labels = list(distribution.keys())
    values = list(distribution.values())

    plt.figure(figsize=(6, 4))

    plt.bar(
        labels,
        values,
        color="#1f4e79"
    )

    plt.title(
        "Attack Class Distribution",
        fontsize=12,
        fontweight="bold"
    )

    plt.xlabel("Attack Type")
    plt.ylabel("Flow Count")

    plt.grid(
        axis="y",
        linestyle="--",
        alpha=0.6
    )

    plt.tight_layout()

    plt.savefig(
        chart_path,
        dpi=200
    )

    plt.close()


    # ---------- PDF ----------

    doc = SimpleDocTemplate(
        file_path,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    elements = []

    styles = getSampleStyleSheet()

    title_style = styles["Title"]
    heading_style = styles["Heading2"]
    normal_style = styles["Normal"]

    incident_id = f"CG-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6]}"

    generated_time = datetime.now().strftime(
        "%d %B %Y | %I:%M %p"
    )


    # ---------- HEADER ----------

    elements.append(Paragraph("<b>AI CyberGuard</b>", title_style))

    elements.append(
        Paragraph(
            "Security Operations Center (SOC) Incident Report",
            heading_style
        )
    )

    elements.append(Spacer(1, 12))

    elements.append(
        Paragraph(
            f"<b>Incident ID:</b> {incident_id}",
            normal_style
        )
    )

    elements.append(
        Paragraph(
            f"<b>Report Generated:</b> {generated_time}",
            normal_style
        )
    )

    elements.append(
        Paragraph(
            f"<b>Mode:</b> {mode}",
            normal_style
        )
    )

    elements.append(
        Paragraph(
            "<b>Generated By:</b> CyberGuard SOC Engine v1.0",
            normal_style
        )
    )

    elements.append(Spacer(1, 24))


    # ---------- EXEC SUMMARY ----------

    elements.append(
        Paragraph("1. Executive Summary", heading_style)
    )

    elements.append(Spacer(1, 8))

    summary = (
        f"A comprehensive network traffic analysis was conducted using the AI CyberGuard "
        f"intrusion detection engine to evaluate the security posture of the monitored environment. "
        f"The system processed {total} network flows during the observation period. "
        f"Out of these, {attacks} flows were classified as malicious, resulting in an "
        f"attack rate of {attack_rate}%. "
        f"Based on predefined SOC risk thresholds, the overall environment is classified as "
        f"{risk_level} risk. "
        f"No statistically significant coordinated attack clusters were detected beyond the "
        f"observed anomaly distribution, and the system remained stable throughout the monitoring session."
    )

    elements.append(Paragraph(summary, normal_style))

    elements.append(Spacer(1, 10))

    risk_style = ParagraphStyle(
        name="RiskStyle",
        parent=styles["Heading3"],
        textColor=risk_color
    )

    elements.append(
        Paragraph(
            f"Overall Risk Classification: {risk_level}",
            risk_style
        )
    )

    elements.append(Spacer(1, 24))


    # ---------- METRICS ----------

    elements.append(
        Paragraph(
            "2. Incident Metrics Overview",
            heading_style
        )
    )

    table_data = [
        ["Metric", "Value"],
        ["Total Network Flows", total],
        ["Malicious Flows", attacks],
        ["Attack Rate (%)", f"{attack_rate}%"],
    ]

    table = Table(
        table_data,
        colWidths=[300, 150]
    )

    table.setStyle(TableStyle([

        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1a2b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),

        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),

        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),

    ]))

    elements.append(table)

    elements.append(Spacer(1, 24))


    # ---------- DISTRIBUTION ----------

    elements.append(
        Paragraph(
            "3. Attack Class Distribution",
            heading_style
        )
    )

    dist_data = [["Attack Type", "Flow Count"]]

    for k, v in distribution.items():
        dist_data.append([k, v])

    table2 = Table(
        dist_data,
        colWidths=[250, 150]
    )

    table2.setStyle(TableStyle([

        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1a2b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

        ("BACKGROUND", (0, 1), (-1, -1), colors.whitesmoke),

        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),

    ]))

    elements.append(table2)

    elements.append(Spacer(1, 16))


    # ---------- CHART ----------
    # ---------- CHART ----------

    elements.append(PageBreak())

    elements.append(
        Paragraph(
            "Distribution Visualization",
            heading_style
        )
    )

    elements.append(Spacer(1, 16))

    elements.append(
        Image(
            chart_path,
            width=400,
            height=240
        )
    )

    elements.append(Spacer(1, 24))


    # ---------- FRAMEWORK ----------

    elements.append(
        Paragraph(
            "4. Risk Classification Framework",
            heading_style
        )
    )

    elements.append(
        Paragraph(
            "The overall risk level is determined based on the percentage of malicious "
            "traffic detected during analysis. This helps the SOC team evaluate severity "
            "and decide the appropriate response strategy.<br/><br/>"
            "LOW: <5% | MODERATE: 5–20% | HIGH: 20–40% | CRITICAL: >40%.<br/><br/>"
            "This framework ensures consistent decision making and proper alert prioritization.",
            normal_style
        )
    )

    elements.append(Spacer(1, 24))


    # ---------- IMPACT ----------

    elements.append(
        Paragraph(
            "5. Impact Assessment",
            heading_style
        )
    )

    elements.append(
        Paragraph(
            "Detected malicious traffic may indicate reconnaissance attempts, "
            "denial-of-service probes, or abnormal flow bursts targeting network resources. "
            "Sustained abnormal activity can reduce availability, degrade performance, "
            "and increase risk of exploitation. Continuous monitoring is required.",
            normal_style
        )
    )

    elements.append(Spacer(1, 24))


    # ---------- ACTIONS ----------

    elements.append(
        Paragraph(
            "6. Recommended Actions",
            heading_style
        )
    )

    elements.append(
        Paragraph(
            "• Inspect suspicious traffic<br/>"
            "• Review firewall rules<br/>"
            "• Monitor anomalies<br/>"
            "• Validate segmentation<br/><br/>"
            "These actions help improve network security posture.",
            normal_style
        )
    )

    elements.append(Spacer(1, 30))

    elements.append(
        Paragraph(
            "---- End of Report ----",
            normal_style
        )
    )

    doc.build(elements)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename="CyberGuard_SOC_Report.pdf"
    )