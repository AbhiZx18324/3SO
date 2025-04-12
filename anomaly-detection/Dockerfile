# Use the official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /anomaly-detection

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose Streamlit's default port
EXPOSE 8501

# Run Streamlit app
CMD ["streamlit", "run", "ui_anomaly_verify.py", "--server.port=8501", "--server.address=0.0.0.0"]
