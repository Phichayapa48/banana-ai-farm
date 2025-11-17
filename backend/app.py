# app.py
import os
import tempfile
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, ImageFilter
import numpy as np
from rembg import remove
from ultralytics import YOLO
import torch

MODEL_LOCAL_PATH = os.environ.get("MODEL_LOCAL_PATH", "best_model.pt")
MODEL_URL = os.environ.get("https://ypdmdfdwzldsifijajrm.supabase.co/storage/v1/object/sign/models/best_model.pt?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mM2JmYjY1Yi1kMjk2LTRjMmQtODI2OS0yZGFiNjhjNzM1MGIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtb2RlbHMvYmVzdF9tb2RlbC5wdCIsImlhdCI6MTc2MzM2NzcyOCwiZXhwIjoxNzk0OTAzNzI4fQ.snFR1IwFSItKitwAJnepeSHZmqy69qyo6QHhw8T8oJU")  # signed URL from Supabase (set as env var)
PORT = int(os.environ.get("PORT", 8000))

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = None

def download_model_if_needed():
    if os.path.exists(MODEL_LOCAL_PATH) and os.path.getsize(MODEL_LOCAL_PATH) > 1000:
        print("Model already exists locally.")
        return
    if not MODEL_URL:
        raise RuntimeError("MODEL_URL not set")
    print("Downloading model...")
    with requests.get(MODEL_URL, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(MODEL_LOCAL_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    print("Model downloaded.")

def load_model():
    global model
    if model is None:
        download_model_if_needed()
        # load model; set device to cpu by default (or 'cuda' if available)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = YOLO(MODEL_LOCAL_PATH)
        model.to(device)
        model.predict = model.predict  # no-op to ensure model loaded
        print("Model loaded on", device)

def preprocess_image_pil(pil_img: Image.Image, size=640):
    # Fix orientation
    pil_img = ImageOps.exif_transpose(pil_img)

    # Optional: sharpen slightly
    pil_img = pil_img.filter(ImageFilter.UnsharpMask(radius=1, percent=100, threshold=3))

    # Remove background (if required)
    try:
        pil_img = remove(pil_img)  # returns RGBA or RGB
    except Exception as e:
        print("rembg failed:", e)

    # Make square with padding (keeps aspect ratio)
    pil_img = ImageOps.pad(pil_img.convert("RGB"), (size, size), method=Image.Resampling.LANCZOS)

    return pil_img

@app.on_event("startup")
async def startup_event():
    load_model()

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(400, "File must be an image")
    contents = await file.read()
    img = Image.open(tempfile.SpooledTemporaryFile()).convert("RGB")  # fallback
    try:
        img = Image.open(tempfile.NamedTemporaryFile(delete=False))
    except Exception:
        pass

    # Simpler approach: open from bytes
    img = Image.open(bytes_to_file(contents)).convert("RGB")

    # Preprocess
    img_pre = preprocess_image_pil(img, size=640)

    # Ultralytics YOLO accepts numpy array or PIL
    np_img = np.array(img_pre)

    # Inference with no_grad and small imgs (reduce batch if needed)
    with torch.no_grad():
        results = model.predict(source=np_img, imgsz=640, conf=0.25, iou=0.45)  # tune conf/iou as needed

    # Build response
    detections = []
    # results is a list-like. Extract boxes & classes
    r = results[0]
    boxes = getattr(r, "boxes", None)
    if boxes is not None:
        for box in boxes:
            # box.xyxy, box.conf, box.cls
            xyxy = box.xyxy.cpu().numpy().tolist() if hasattr(box, "xyxy") else []
            conf = float(box.conf[0]) if hasattr(box, "conf") else None
            cls = int(box.cls[0]) if hasattr(box, "cls") else None
            detections.append({"xyxy": xyxy, "conf": conf, "class": cls})

    return {"detections": detections}

# helper to open bytes as PIL-friendly file
import io
def bytes_to_file(b: bytes):
    return io.BytesIO(b)
