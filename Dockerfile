FROM python:3.11-slim

# --- OS dependencies ---
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# --- Set working directory ---
WORKDIR /app

# --- Copy backend ---
COPY backend/ .

# --- Install Python dependencies ---
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Expose default port ---
EXPOSE 8000

# --- Set environment variables defaults ---
ENV MODEL_LOCAL_PATH=best_model.onnx

# --- Start FastAPI server using ENTRYPOINT ---
ENTRYPOINT ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0"]
CMD ["--port", "8000"]
