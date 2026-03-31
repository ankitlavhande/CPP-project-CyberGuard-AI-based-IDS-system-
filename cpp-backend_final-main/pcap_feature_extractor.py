from scapy.all import rdpcap, IP
import pandas as pd

def extract_flow_features(pcap_file):
    packets = rdpcap(pcap_file)

    total_packets = 0
    total_bytes = 0
    timestamps = []

    for pkt in packets:
        if IP in pkt:
            total_packets += 1
            total_bytes += len(pkt)
            timestamps.append(pkt.time)

    if len(timestamps) > 1:
        duration = max(timestamps) - min(timestamps)
    else:
        duration = 0

    if duration > 0:
        bytes_per_sec = total_bytes / duration
        packets_per_sec = total_packets / duration
    else:
        bytes_per_sec = 0
        packets_per_sec = 0

    data = {
        "Flow Duration": duration,
        "Total Fwd Packets": total_packets,
        "Total Backward Packets": 0,
        "Total Length of Fwd Packets": total_bytes,
        "Total Length of Bwd Packets": 0,
        "Flow Bytes/s": bytes_per_sec,
        "Flow Packets/s": packets_per_sec,
        "Average Packet Size": total_bytes / total_packets if total_packets > 0 else 0,
    }

    return pd.DataFrame([data])