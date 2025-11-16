# backend/app.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import requests, os, tempfile

app = FastAPI()

# --- ตั้งค่า CORS ให้ frontend เรียก API ได้ ---
origins = ["*"]  # ถ้าอยากจำกัดโดเมน เปลี่ยนเป็น list ของ URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase Model URL ---
MODEL_URL = "https://ypdmdfdwzldsifijajrm.supabase.co/storage/v1/object/sign/models/best_model.pt?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2JmYjY1Yi1kMjk2LTRjMmQtODI2OS0yZGFiNjhjNzM1MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb2RlbHMvYmVzdF9tb2RlbC5wdCIsImlhdCI6MTc2MzI5ODUyNCwiZXhwIjoxNzk0ODM0NTI0fQ._oxs0dHF9WLGWPglco7OA1fQx46hTVvT9X87TfD0ukc"
MODEL_LOCAL_PATH = "best_model.pt"

# --- โหลดโมเดลถ้าไฟล์ยังไม่มีใน backend ---
if not os.path.exists(MODEL_LOCAL_PATH):
    print("Downloading model from Supabase...")
    response = requests.get(MODEL_URL)
    response.raise_for_status()
    with open(MODEL_LOCAL_PATH, "wb") as f:
        f.write(response.content)
    print("Model downloaded.")

# --- โหลด YOLOv8 โมเดล ---
model = YOLO(MODEL_LOCAL_PATH)
print("Model loaded successfully.")

# --- Endpoint ทดสอบว่า backend พร้อม ---
@app.get("/")
async def root():
    return {"message": "Backend is running!"}

# --- Endpoint สำหรับ Predict ---
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # อ่านไฟล์ image จาก UploadFile
    image_bytes = await file.read()
    
    # สร้าง temporary file สำหรับ YOLO predict
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=True) as tmp:
        tmp.write(image_bytes)
        tmp.flush()
        # ทำ prediction
        results = model.predict(tmp.name)

    # แปลงผลเป็น JSON
    output = []
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy()  # x1, y1, x2, y2
        confs = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy()
        labels = result.boxes.cls.cpu().numpy()  # หรือ map class id เป็นชื่อ class
        for i in range(len(boxes)):
            output.append({
                "bbox": boxes[i].tolist(),
                "confidence": float(confs[i]),
                "class_id": int(classes[i]),
                "label": str(labels[i])
            })

    return {"predictions": output}

