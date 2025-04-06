import os
from utils.detectorRB import detect_anomalies_RB
from utils.flag_anomaly import or_based, and_based
from utils.savefile import savefile
from utils.predict import predict_anomalies

RULES_FILE = os.getenv("RULES_FILE", "rules.txt")
LOG_FILE = os.getenv("LOG_FILE", "data/test_log.csv")
RB_RESULT_FILE = os.getenv("RB_RESULT_FILE", "data/test_results.csv")
RB_ANOMALIES_FILE = os.getenv("RB_ANOMALIES_FILE", "data/rb_anomalies.csv")
ML_ANOMALIES_FILE = os.getenv("ML_ANOMALIES_FILE", "data/ml_anomalies.csv")

def routine(RULES_FILE : str = RULES_FILE, LOG_FILE : str = LOG_FILE, RB_RESULT_FILE : str = RB_RESULT_FILE, 
            RB_ANOMALIES_FILE : str = RB_ANOMALIES_FILE, ML_ANOMALIES_FILE : str = ML_ANOMALIES_FILE):
    RBtest_result = detect_anomalies_RB(LOG_FILE, RULES_FILE)
    savefile(RBtest_result, RB_RESULT_FILE)

    rb_anomaly_df = or_based(RB_RESULT_FILE)
    savefile(rb_anomaly_df, RB_ANOMALIES_FILE)

    ml_anomaly_df = predict_anomalies(RB_RESULT_FILE)
    savefile(ml_anomaly_df, ML_ANOMALIES_FILE)