import os
from detectorRB import detect_anomalies_RB
from flag_anomaly import or_based
from savefile import savefile

RULES_FILE = os.getenv("RULES_FILE", "rules.txt")
LOG_FILE = os.getenv("LOG_FILE", "test_log.csv")
RB_RESULT_FILE = os.getenv("RB_RESULT_FILE", "test_results.csv")
ANOMALIES_FILE = os.getenv("ANOMALIES_FILE", "anomalies.csv")

RBtest_result = detect_anomalies_RB(LOG_FILE, RULES_FILE)
savefile(RBtest_result, RB_RESULT_FILE)

anomaly_df = or_based(RB_RESULT_FILE)
savefile(anomaly_df, ANOMALIES_FILE)