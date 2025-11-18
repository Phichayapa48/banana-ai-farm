FROM python:3.11-slim

# ลดขนาด + ติดตั้งเฉพาะที่จำเป็น
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# นำโค้ดเข้ามา
COPY . .

# เปิด port ให้ Render detect
EXPOSE 10000

# เรียก uvicorn ใช้ environment PORT ของ Render
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000}"]
