FROM python:3.11-slim

# ลดขนาด + ใส่ lib ที่ต้องใช้กับ onnxruntime / pillow
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมด
COPY . .

# ให้ uvicorn ใช้พอร์ตตาม environment
ENV PORT=8000

# รัน API
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
