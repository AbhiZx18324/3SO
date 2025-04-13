# 🛡️ Anomaly Detection System

A rule-based and machine learning-assisted anomaly detection system tailored to identify suspicious login attempts. This system supports expert verification through an interactive UI and can fetch logs in real-time or simulate them for model training and evaluation.

## 📁 Project Structure
```bash
3SO/anomaly-detection/
├── .gitignore
├── Dockerfile
├── requirements.txt
├── ui_anomaly_verify.py          # Streamlit UI for anomaly verification
│
├── data/                         # Stores raw logs and anomaly results
│   └── verified/                 # Stores verified anomalies (human-verified)
│       └── .gitkeep
│
├── rule/
│   ├── rules.txt                 # Human-defined rules for detecting anomalies
│   └── syntax.txt                # Syntax documentation for writing rules
│
├── rule_engine/                 # Parses and creates rule objects
│   ├── factory.py
│   ├── plain.py
│   ├── relation.py
│   ├── time.py
│   └── __init__.py
│
└── utils/                       # Utility modules and ML components
    ├── detectorRB.py            # Applies rules to logs
    ├── fetch_data.py            # Fetches logs from external URL
    ├── flag_anomaly.py          # Tags anomalies using various logic
    ├── model.ipynb              # Jupyter notebook for training the ML model
    ├── predict.py               # Uses pretrained ML model to flag anomalies
    ├── routine.py               # Workflow orchestration
    ├── savefile.py              # Saves intermediate CSVs
    ├── test_data.py             # Generates synthetic log data
    └── ML/
        ├── scaler.pkl           # Scaler used during training
        └── svm_model.pkl        # Trained SVM model for anomaly detection
```

# 📌 Key Features
    - 🔍 <b>Rule-Based Detection:</b> Manually written rules in rules.txt are parsed and applied on log data.

    - 🤖 ML-Based Detection: Pretrained SVM model used to identify anomalies based on feature patterns.

    - 🧑‍💻 Expert Feedback Loop: A UI (ui_anomaly_verify.py) for manual verification and feedback collection.

    - 🌐 Data Fetching: Logs can be fetched dynamically from a given endpoint (LOGS_URL).

    - 🧪 Synthetic Data Generation: test_data.py allows creating realistic dummy data for early development/training.

    - 📦 Docker Support: Fully containerized using Docker for easy deployment.