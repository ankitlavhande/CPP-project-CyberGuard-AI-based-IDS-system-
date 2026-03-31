# CyberGuard AI-Based Intrusion Detection System

## Overview
CyberGuard is an AI-based Intrusion Detection System (IDS) that monitors network traffic and detects attacks in real time using machine learning.

## Features
- Real-time traffic monitoring using Scapy
- AI-based attack detection using LightGBM
- Multiclass classification (DoS, DDoS, PortScan, etc.)
- Batch and Live prediction modes
- FastAPI backend with dashboard visualization

## Tech Stack
- Python
- FastAPI
- LightGBM
- Scapy
- React

## Workflow
Packet Capture → Feature Extraction → Scaling → Model Prediction → API → Dashboard

## Limitations
- Trained on CICIDS-2017 dataset
- Accuracy depends on similarity with real-world traffic
- Prototype system (not production-ready)

## Team Members
- Ankit – Backend integration, AI model implementation, documentation.
- Lekh – Backend development, API routes, and system logic
- Rishabh – Research paper, and report preparation , FastAPI, and system workflow
