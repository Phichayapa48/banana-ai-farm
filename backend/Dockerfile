FROM python:3.11-slim

# ติดตั้ง OS dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements และติดตั้ง
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy โค้ดทั้งหมด
COPY . .

# ให้สามารถรัน entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
