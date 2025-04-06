import streamlit as st
import pandas as pd
import os
from routine import routine

RULES_FILE = os.getenv("RULES_FILE", "rules.txt")
LOG_FILE = os.getenv("LOG_FILE", "data/test_log.csv")
RB_RESULT_FILE = os.getenv("RB_RESULT_FILE", "data/test_results.csv")
RB_ANOMALIES_FILE = os.getenv("RB_ANOMALIES_FILE", "data/rb_anomalies.csv")
ML_ANOMALIES_FILE = os.getenv("ML_ANOMALIES_FILE", "data/ml_anomalies.csv")

st.set_page_config(page_title="Anomaly Verifier", layout="wide")
st.title("🧠 Expert Anomaly Verification UI")

# Track if pipeline has been run
if "pipeline_ran" not in st.session_state:
    st.session_state.pipeline_ran = False

# Button to run anomaly detection
if st.button("🚀 Run Anomaly Detection Pipeline"):
    with st.spinner("Running anomaly detection..."):
        try:
            routine(RULES_FILE, LOG_FILE, RB_RESULT_FILE, RB_ANOMALIES_FILE, ML_ANOMALIES_FILE)
            st.success("Anomaly detection completed! CSVs generated.")
            st.session_state.pipeline_ran = True
            st.rerun()  # Force rerun so the next part loads
        except Exception as e:
            st.error("An error occurred while running the anomaly detection routine.")
            st.exception(e)

# Now check and load the data
if st.session_state.pipeline_ran and os.path.exists(ML_ANOMALIES_FILE) and os.path.exists(RB_ANOMALIES_FILE):
    rb_df = pd.read_csv(RB_ANOMALIES_FILE, parse_dates=["Datetime"])
    ml_df = pd.read_csv(ML_ANOMALIES_FILE, parse_dates=["Datetime"])

    st.subheader("🔍 Machine Learning Predicted Anomalies")
    filtered = ml_df[ml_df["Anomaly"] == 1].reset_index(drop=True)

    if filtered.empty:
        st.info("🎉 No anomalies were predicted by the model.")
    else:
        for idx, row in filtered.iterrows():
            with st.expander(f"🕒 {row['Datetime']} | Total Logins: {row['total_logins']} | Fail Ratio: {row['fail_ratio']:.2f} | Failed Logins: {row['failed_logins']}"):
                st.write(row.to_frame().dropna().T)

                choice = st.radio(
                    "🧐 Expert decision for this anomaly:",
                    ["Unverified", "True Threat", "False Positive", "Unsure"],
                    key=idx,
                    index=0
                )
                filtered.at[idx, "Expert_Verification"] = choice
                if choice == "True Threat":
                    row['Anomaly'] = True
                elif choice == "False Positive":
                    row['Anomaly'] = False

        if st.button("💾 Save Verified Anomalies"):
            filtered.to_csv("ml_verified_anomalies.csv", index=False)
            st.success("✅ Saved to ml_verified_anomalies.csv")

    st.subheader("🔍 Rule Based Predicted Anomalies")
    filtered = rb_df[rb_df["Anomaly"] == True].reset_index(drop=True)

    if filtered.empty:
        st.info("🎉 No anomalies were predicted by the model.")
    else:
        for idx, row in filtered.iterrows():
            with st.expander(f"🕒 {row['Datetime']} | User: {row['User']} | FKL_Process: {row['FKL_Process']}"):
                st.write(row.to_frame().dropna().T)

                choice = st.radio(
                    "🧐 Expert decision for this anomaly:",
                    ["Unverified", "True Threat", "False Positive", "Unsure"],
                    key=idx + len(ml_df),
                    index=0
                )
                filtered.at[idx, "Expert_Verification"] = choice
                if choice == "True Threat":
                    row['Anomaly'] = True
                elif choice == "False Positive":
                    row['Anomaly'] = False

        if st.button("💾 Save Verified Anomalies", key = len(ml_df) + len(rb_df)):
            filtered.to_csv("rb_verified_anomalies.csv", index=False)
            st.success("✅ Saved to rb_verified_anomalies.csv")

else:
    st.warning("⚠️ Please run the anomaly detection pipeline to generate CSVs.")
