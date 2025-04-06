import pandas as pd
import numpy as np
from datetime import datetime, timedelta, time

def generate_anomaly_detection_df(num_rows=100):
    """
    Generates a DataFrame for testing an anomaly detection system.
    """
    dates = pd.to_datetime([datetime(2023, np.random.randint(1,12), 
                                            np.random.randint(1, 28),
                                            np.random.randint(0, 24),
                                            np.random.randint(0, 60),
                                            np.random.randint(0, 60)) for _ in range(num_rows)])
    times = pd.to_timedelta(np.random.randint(0, 24 * 60 * 60, num_rows), unit='s')
    users = [f"{np.random.choice(['J', 'S', 'A', 'B'])}{np.random.randint(100, 999)}" for _ in range(num_rows)]
    ids = np.random.randint(10000, 99999, num_rows)
    processes = ['Login'] * num_rows
    fkl_processes = np.random.randint(0, 20, num_rows)

    df = pd.DataFrame({
        'Date': dates,
        'Time': times,
        'User': users,
        'ID': ids,
        'Process': processes,
        'FKL_Process': fkl_processes
    })

    df['DateTime'] = df['Date'] + df['Time']
    df['Date'] = df['DateTime'].dt.date
    df['Time'] = df['DateTime'].dt.time
    df = df.drop(columns=['DateTime'])

    # Introduce some anomalies
    anomaly_indices = np.random.choice(num_rows, int(num_rows * 0.1), replace=False) #10 percent anomalies.
    for i in anomaly_indices:
        if i % 2 ==0: #make some of the anomalies fit the rules.
            df.loc[i, 'User'] = f"J{np.random.randint(100, 999)}"
            df.loc[i, 'FKL_Process'] = np.random.randint(8, 17)
            df.loc[i, 'Time'] = time(np.random.randint(20, 24), np.random.randint(0, 60), np.random.randint(0, 60))
        else: #make some of the anomalies not fit the rules.
            df.loc[i, 'User'] = f"C{np.random.randint(100, 999)}"
            df.loc[i, 'FKL_Process'] = np.random.randint(0, 8)
            df.loc[i, 'Time'] = time(np.random.randint(10, 18), np.random.randint(0, 60), np.random.randint(0, 60))
    #add login reset anomalies.
    reset_anomaly_indices = np.random.choice(num_rows, int(num_rows * 0.05), replace=False) #5 percent reset anomalies.
    for i in reset_anomaly_indices:
        df.loc[i, 'User'] = f"S{np.random.randint(100, 999)}"
        df.loc[i, 'FKL_Process'] = np.random.randint(8, 17)
        df.loc[i, 'Time'] = time(np.random.randint(20, 24), np.random.randint(0, 60), np.random.randint(0, 60))
        df.loc[i, 'Date'] = df.loc[i, 'Date'] - timedelta(days=1)

    df["Datetime"] = pd.to_datetime(df["Date"].astype(str) + " " + df["Time"].astype(str))
    df.sort_values("Datetime", inplace=True)
    df.set_index("Datetime", inplace=True)
    df.drop(columns=["Date", "Time"], inplace=True)

    return df

df = generate_anomaly_detection_df(100000)
filepath = "data/test_log.csv"

try:
    df.to_csv(filepath)
    print(f"DataFrame saved to {filepath}")
except Exception as e:
    print(f"An error occurred while saving the DataFrame: {e}")