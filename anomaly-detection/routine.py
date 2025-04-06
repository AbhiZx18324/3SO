import os
from utils.detectorRB import detect_anomalies_RB
from utils.flag_anomaly import or_based, and_based
from utils.savefile import savefile

RULES_FILE = os.getenv("RULES_FILE", "rules.txt")
LOG_FILE = os.getenv("LOG_FILE", "data/test_log.csv")
RB_RESULT_FILE = os.getenv("RB_RESULT_FILE", "data/test_results.csv")
ANOMALIES_FILE = os.getenv("ANOMALIES_FILE", "data/anomalies.csv")

RBtest_result = detect_anomalies_RB(LOG_FILE, RULES_FILE)
savefile(RBtest_result, RB_RESULT_FILE)

anomaly_df = or_based(RB_RESULT_FILE)
savefile(anomaly_df, ANOMALIES_FILE)