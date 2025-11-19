# --- Base image ---
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

# --- Copy backend code ---
COPY backend/ .

# --- Install Python dependencies ---
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Expose port (optional, mainly for documentation) ---
EXPOSE 8000

# --- Set default environment variables ---
ENV MODEL_LOCAL_PATH=best_model.onnx

# --- Start FastAPI server with dynamic Railway PORT ---
CMD ["sh", "-c", "python -m uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
