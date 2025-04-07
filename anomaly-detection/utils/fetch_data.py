import requests
import pandas as pd
import os
from datetime import datetime

LOGS_URL = os.getenv("LOGS_URL", "http://localhost:3000/admin/logins")
LOGS_FILE = os.getenv("LOGS_FILE", "data/logs.csv")

def fetch_and_update(LOGS_URL : str = LOGS_URL, LOGS_FILE : str = LOGS_FILE):
    added = 0
    try:
        response = requests.get(LOGS_URL)
        response.raise_for_status()
        data = response.json()

        if not data:
            print("No data received from the endpoint.")
            return

        df_new = pd.DataFrame(data)

        df_new["Datetime"] = pd.to_datetime(df_new["Datetime"])

        if os.path.exists(LOGS_FILE):
            df_existing = pd.read_csv(LOGS_FILE, parse_dates=["Datetime"])

            last_time = df_existing["Datetime"].max()

            df_to_add = df_new[df_new["Datetime"] > last_time]
            added = len(df_to_add)
            if df_to_add.empty:
                print("No new records to append.")
                return

            df_updated = pd.concat([df_existing, df_to_add], ignore_index=True)
        else:
            df_updated = df_new

        df_updated.to_csv(LOGS_FILE, index=False)
        print(f"Updated {LOGS_FILE} with {len(df_updated)} total records.")

    except Exception as e:
        print("Error:", e)
    
    return added

fetch_and_update()