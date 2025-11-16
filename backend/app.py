from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from ultralytics import YOLO
from pathlib import Path
import shutil

# โหลดโมเดล YOLOv8 ของเรา
model = YOLO("model/best.pt")  # ใส่ path โมเดลของเรา

app = FastAPI()

# ตั้งค่า CORS ให้เรียกจาก frontend ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    results = model(temp_file)
    return results[0].boxes.data.tolist()  # ส่งผลลัพธ์เป็น list

