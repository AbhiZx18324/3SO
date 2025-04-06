import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, 'ML', 'svm_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'ML', 'scaler.pkl')

svm_model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

def predict_anomalies(result_file : str) -> pd.DataFrame:
    """
    Applies the saved SVM model to a DataFrame and returns the DataFrame
    with added 'Prediction' and 'Anomaly_Probability' columns.
    
    Expected columns: ['total_logins', 'failed_logins', 'fail_ratio', 'Rule1', 'Time1']
    """
    df = pd.read_csv(result_file)
    df['Datetime'] = pd.to_datetime(df['Datetime'])
    df.set_index('Datetime', inplace=True)

    df.index = pd.to_datetime(df.index).round("h")
    df.index.name = "Datetime"
    df["is_failed"] = 1 - df["FKL_Process"]

    # Group by User and Date
    df = df.groupby(["Datetime"]).agg(
        total_logins=("Process", "count"),
        failed_logins=("is_failed", "sum"),
        Rule1=("Rule1", "any"),
        Time1=("Time1", "any"),
    ).reset_index()

    df["fail_ratio"] = df["failed_logins"] / df["total_logins"]
    df['hour'] = df['Datetime'].dt.hour
    df['dayofweek'] = df['Datetime'].dt.dayofweek

    features = ['total_logins', 'failed_logins', 'fail_ratio', 'Rule1', 'Time1', 'hour', 'dayofweek']
    X = df[features].copy()
    
    X['Rule1'] = X['Rule1'].astype(int)
    X['Time1'] = X['Time1'].astype(int)
    
    X_scaled = scaler.transform(X)

    preds = svm_model.predict(X_scaled)
    probs = svm_model.predict_proba(X_scaled)[:, 1]
    
    df['Prediction'] = preds
    df['Anomaly_Probability'] = probs
    
    return df