# app.py
import os
import io
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, ImageFilter
from rembg import remove
from ultralytics import YOLO
import torch

# --- Config ---
MODEL_URL = "https://ypdmdfdwzldsifijajrm.supabase.co/storage/v1/object/sign/models/best_model.pt?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2JmYjY1Yi1kMjk2LTRjMmQtODI2OS0yZGFiNjhjNzM1MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb2RlbHMvYmVzdF9tb2RlbC5wdCIsImlhdCI6MTc2MzM2Nzk3MSwiZXhwIjoxNzk0OTAzOTcxfQ.x9IUU--KnWphbtjPojB6PmKAfCkPAwaGeOzh4kO_ImM"  # ใส่ token จริง
MODEL_LOCAL_PATH = "best_model.pt"

PORT = int(os.environ.get("PORT", 8000))

# --- FastAPI app ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model placeholder ---
model = None

# --- Download model if not exists ---
def download_model_if_needed():
    if os.path.exists(MODEL_LOCAL_PATH) and os.path.getsize(MODEL_LOCAL_PATH) > 1000:
        print("✅ Model already exists locally.")
        return
    print("⬇️ Downloading model from URL...")
    with requests.get(MODEL_URL, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(MODEL_LOCAL_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    print("✅ Model downloaded.")

# --- Load YOLO model ---
def load_model():
    global model
    if model is None:
        download_model_if_needed()
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = YOLO(MODEL_LOCAL_PATH)
        print(f"🚀 Model loaded on {device}")

# --- Preprocess image ---
def preprocess_image_pil(pil_img: Image.Image, size=640):
    # Fix orientation
    pil_img = ImageOps.exif_transpose(pil_img)

    # Optional: sharpen slightly
    pil_img = pil_img.filter(ImageFilter.UnsharpMask(radius=1, percent=100, threshold=3))

    # Remove background (optional)
    try:
        pil_img = remove(pil_img)
    except Exception as e:
        print("⚠️ rembg failed:", e)

    # Make square with padding
    pil_img = ImageOps.pad(pil_img.convert("RGB"), (size, size), method=Image.Resampling.LANCZOS)

    return pil_img

# --- Startup event ---
@app.on_event("startup")
async def startup_event():
    load_model()

# --- Helper: bytes -> PIL ---
def bytes_to_pil(b: bytes):
    return Image.open(io.BytesIO(b))

# --- Detection endpoint ---
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(400, "File must be an image")

    contents = await file.read()
    img = bytes_to_pil(contents).convert("RGB")
    img_pre = preprocess_image_pil(img, size=640)
    np_img = np.array(img_pre)

    # Inference
    with torch.no_grad():
        results = model.predict(source=np_img, imgsz=640, conf=0.25, iou=0.45)

    # Build response
    detections = []
    r = results[0]
    boxes = getattr(r, "boxes", [])
    for box in boxes:
        xyxy = box.xyxy.cpu().numpy().tolist()
        conf = float(box.conf.cpu().numpy())
        cls = int(box.cls.cpu().numpy())
        detections.append({"xyxy": xyxy, "conf": conf, "class": cls})

    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
