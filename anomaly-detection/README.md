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

# Key Features

* **🔍 Rule-Based Detection:** Leverages manually crafted rules from `rules.txt` to analyze log data.
* **🤖 ML-Based Detection:** Employs a pretrained SVM model for anomaly identification based on learned feature patterns.
* **🧑‍💻 Expert Feedback Loop:** Includes a user interface (`ui_anomaly_verify.py`) for manual review and feedback integration.
* **🌐 Data Fetching:** Enables dynamic retrieval of logs from a specified endpoint (`LOGS_URL`).
* **🧪 Synthetic Data Generation:** Provides `test_data.py` for generating realistic dummy data for development and training purposes.
* **📦 Docker Support:** Fully containerized with Docker for streamlined deployment.

## Environment Variables

| Variable                | Default                          | Description                                            |
|-------------------------|----------------------------------|--------------------------------------------------------|
| `RULES_FILE`            | `rule/rules.txt`                 | Path to rule definitions                               |
| `LOGS_FILE`             | `data/logs.csv`                  | Fallback log file location                             |
| `LOGS_URL`              | `http://host.docker.internal:3000/admin/logins` | Endpoint to fetch login logs                           |
| `RB_RESULT_FILE`        | `data/rb_results.csv`            | Rule-based detection result                            |
| `RB_ANOMALIES_FILE`     | `data/rb_anomalies.csv`          | Rule-based anomalies                                   |
| `ML_ANOMALIES_FILE`     | `data/ml_anomalies.csv`          | ML-based anomalies                                      |
| `ML_VERIFIED_ANOMALIES` | `data/verified/ml_verified_anomalies.csv` | Expert Verified ML anomalies                                 |
| `RB_VERIFIED_ANOMALIES` | `data/verified/rb_verified_anomalies.csv` | Expert Verified rule-based anomalies                         |

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [https://github.com/3SO/anomaly-detection.git](https://github.com/3SO/anomaly-detection.git)
   cd anomaly-detection
   ```
2. **Build Docker Image**
    ```bash
    docker build -t anomaly-detector .
    ```
3. **Run Docker Container**
    ```bash
    docker run -p 8501:8501 --add-host=host.internal.docker:host-gateway anomaly-detector
    ```
    Access URL at: [http://localhost:8501](http://localhost:8501)


