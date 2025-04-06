import pandas as pd
from detectorRB import detect_anomalies_RB

anamalous_df = detect_anomalies_RB("test_log.csv", "rules.txt")

savepath = "test_results.csv"

try:
    anamalous_df.to_csv(savepath)
    print(f"DataFrame saved to {savepath}")
except Exception as e:
    print(f"An error occurred while saving the DataFrame: {e}")