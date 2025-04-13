# 🛡️ 3SO Anomaly Detection System

This project is part of the **3SO (Single Sign-On Security Operations)** suite and provides a robust rule-based and machine learning-assisted anomaly detection framework for login attempts. It combines domain-specific rule evaluation, anomaly scoring, and an expert-verification UI to ensure a reliable security posture.

---

## 📁 Directory Structure

### 3SO/anomaly-detection/

```
ª   .gitignore
ª   Dockerfile
ª   requirements.txt
ª   ui_anomaly_verify.py
ª   
+---data
ª   ª   .gitkeep
ª   ª   
ª   +---verified
ª           .gitkeep
ª           
+---rule
ª       rules.txt
ª       syntax.txt
ª       
+---rule_engine
ª       factory.py
ª       plain.py
ª       relation.py
ª       time.py
ª       __init__.py
ª       
+---utils
    ª   detectorRB.py
    ª   fetch_data.py
    ª   flag_anomaly.py
    ª   model.ipynb
    ª   predict.py
    ª   routine.py
    ª   savefile.py
    ª   test_data.py
    ª   
    +---ML
            scaler.pkl
            svm_model.pkl
```