# 🛡️ 3SO Anomaly Detection System

This project is part of the **3SO (Single Sign-On Security Operations)** suite and provides a robust rule-based and machine learning-assisted anomaly detection framework for login attempts. It combines domain-specific rule evaluation, anomaly scoring, and an expert-verification UI to ensure a reliable security posture.

---

<summary>📂 Project Structure</summary>
```
anomaly-detection/
├── rule/                  # Contains manually written rules and syntax reference
│   ├── rules.txt
│   └── syntax.txt
│
├── rule_engine/           # Logic to parse and apply rules (plain, relation, time)
│   ├── factory.py
│   ├── plain.py
│   ├── relation.py
│   └── time.py
│
├── utils/                 # Helper modules for data fetching, detection, prediction
│   ├── detectorRB.py
│   ├── fetch_data.py
│   ├── flag_anomaly.py
│   ├── predict.py
│   ├── routine.py
│   ├── savefile.py
│   └── ML/                # Pre-trained ML models and scaler
│       ├── scaler.pkl
│       └── svm_model.pkl
│
├── data/                  # Input data and output results (CSV)
│   └── verified/          # Manually verified anomalies
│
├── ui_anomaly_verify.py   # Streamlit app for anomaly verification
├── requirements.txt
└── Dockerfile
```