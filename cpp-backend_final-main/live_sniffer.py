from scapy.all import sniff, IP, TCP, UDP
import time
import numpy as np
import pandas as pd

from model_loader import model, scaler, encoder, feature_columns

flows = {}
FLOW_TIMEOUT = 20  # seconds


def safe_stats(arr):
    if len(arr) == 0:
        return 0, 0, 0, 0
    return (
        np.mean(arr),
        np.std(arr),
        np.min(arr),
        np.max(arr)
    )


def get_bidirectional_key(packet):
    if IP not in packet:
        return None, None

    src = packet[IP].src
    dst = packet[IP].dst
    proto = packet[IP].proto

    sport = None
    dport = None

    if TCP in packet:
        sport = packet[TCP].sport
        dport = packet[TCP].dport
    elif UDP in packet:
        sport = packet[UDP].sport
        dport = packet[UDP].dport

    if sport is None or dport is None:
        return None, None

    if (src, sport) < (dst, dport):
        return (src, sport, dst, dport, proto), "fwd"
    else:
        return (dst, dport, src, sport, proto), "bwd"


def process_packet(packet):
    key, direction = get_bidirectional_key(packet)
    if key is None:
        return

    now = time.time()

    if key not in flows:
        flows[key] = {
            "fwd_packets": 0,
            "bwd_packets": 0,
            "fwd_bytes": 0,
            "bwd_bytes": 0,
            "fwd_lengths": [],
            "bwd_lengths": [],
            "fwd_iat": [],
            "bwd_iat": [],
            "last_fwd_time": None,
            "last_bwd_time": None,
            "syn": 0,
            "ack": 0,
            "fin": 0,
            "rst": 0,
            "psh": 0,
            "urg": 0,
            "start_time": now,
            "last_seen": now
        }

    flow = flows[key]

    pkt_len = len(packet)

    # Directional stats
    if direction == "fwd":
        flow["fwd_packets"] += 1
        flow["fwd_bytes"] += pkt_len
        flow["fwd_lengths"].append(pkt_len)

        if flow["last_fwd_time"] is not None:
            flow["fwd_iat"].append(now - flow["last_fwd_time"])
        flow["last_fwd_time"] = now

    else:
        flow["bwd_packets"] += 1
        flow["bwd_bytes"] += pkt_len
        flow["bwd_lengths"].append(pkt_len)

        if flow["last_bwd_time"] is not None:
            flow["bwd_iat"].append(now - flow["last_bwd_time"])
        flow["last_bwd_time"] = now

    # TCP flags
    if TCP in packet:
        flags = packet[TCP].flags
        if flags & 0x02: flow["syn"] += 1
        if flags & 0x10: flow["ack"] += 1
        if flags & 0x01: flow["fin"] += 1
        if flags & 0x04: flow["rst"] += 1
        if flags & 0x08: flow["psh"] += 1
        if flags & 0x20: flow["urg"] += 1

    flow["last_seen"] = now

    cleanup_flows(now)


def cleanup_flows(current_time):
    expired = []

    for key, flow in list(flows.items()):
        if current_time - flow["last_seen"] > FLOW_TIMEOUT:

            duration = flow["last_seen"] - flow["start_time"]
            total_packets = flow["fwd_packets"] + flow["bwd_packets"]
            total_bytes = flow["fwd_bytes"] + flow["bwd_bytes"]

            bytes_per_sec = total_bytes / duration if duration > 0 else 0
            packets_per_sec = total_packets / duration if duration > 0 else 0

            # Packet length stats
            fwd_mean, fwd_std, fwd_min, fwd_max = safe_stats(flow["fwd_lengths"])
            bwd_mean, bwd_std, bwd_min, bwd_max = safe_stats(flow["bwd_lengths"])

            # IAT stats
            fwd_iat_mean, fwd_iat_std, fwd_iat_min, fwd_iat_max = safe_stats(flow["fwd_iat"])
            bwd_iat_mean, bwd_iat_std, bwd_iat_min, bwd_iat_max = safe_stats(flow["bwd_iat"])

            down_up_ratio = (
                flow["bwd_packets"] / flow["fwd_packets"]
                if flow["fwd_packets"] > 0 else 0
            )

            # Build feature dictionary (~40 real features)
            features = {
                "Destination Port": key[3],
                "Flow Duration": duration,
                "Total Fwd Packets": flow["fwd_packets"],
                "Total Backward Packets": flow["bwd_packets"],
                "Total Length of Fwd Packets": flow["fwd_bytes"],
                "Total Length of Bwd Packets": flow["bwd_bytes"],
                "Flow Bytes/s": bytes_per_sec,
                "Flow Packets/s": packets_per_sec,

                "Fwd Packet Length Mean": fwd_mean,
                "Fwd Packet Length Std": fwd_std,
                "Fwd Packet Length Min": fwd_min,
                "Fwd Packet Length Max": fwd_max,

                "Bwd Packet Length Mean": bwd_mean,
                "Bwd Packet Length Std": bwd_std,
                "Bwd Packet Length Min": bwd_min,
                "Bwd Packet Length Max": bwd_max,

                "Fwd IAT Mean": fwd_iat_mean,
                "Fwd IAT Std": fwd_iat_std,
                "Fwd IAT Min": fwd_iat_min,
                "Fwd IAT Max": fwd_iat_max,

                "Bwd IAT Mean": bwd_iat_mean,
                "Bwd IAT Std": bwd_iat_std,
                "Bwd IAT Min": bwd_iat_min,
                "Bwd IAT Max": bwd_iat_max,

                "SYN Flag Count": flow["syn"],
                "ACK Flag Count": flow["ack"],
                "FIN Flag Count": flow["fin"],
                "RST Flag Count": flow["rst"],
                "PSH Flag Count": flow["psh"],
                "URG Flag Count": flow["urg"],

                "Down/Up Ratio": down_up_ratio
            }

            try:
                df = pd.DataFrame([features])
                df = df.reindex(columns=feature_columns, fill_value=0)

                scaled = scaler.transform(df)
                pred_index = model.predict(scaled)[0]
                label = encoder.inverse_transform([pred_index])[0]

                print("\n=== FLOW CLASSIFICATION ===")
                print("Flow:", key)
                print("Duration:", round(duration, 3))
                print("Packets:", total_packets)
                print("Bytes/sec:", round(bytes_per_sec, 2))
                print("Prediction:", label)
                print("============================")

            except Exception as e:
                print("Prediction error:", e)

            expired.append(key)

    for key in expired:
        del flows[key]


print("Listening with enhanced real-time feature extraction...")
sniff(prn=process_packet, store=False)