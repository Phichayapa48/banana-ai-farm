FROM python:3.11-slim

# ติดตั้ง dependencies ที่จำเป็นสำหรับ OpenCV, rembg, และ YOLO
RUN apt-get update && apt-get install -y \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgthread-2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements และติดตั้ง
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app ทั้งหมด
COPY . .

# ให้สามารถรันไฟล์ shell script ได้ (ถ้ามี)
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
