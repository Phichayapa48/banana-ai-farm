import os
import io
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from rembg import remove
import numpy as np
import onnxruntime as ort

# --- Config ---
MODEL_URL = os.environ.get("MODEL_URL")
MODEL_LOCAL_PATH = os.environ.get("MODEL_LOCAL_PATH", "best_model.onnx")
PORT = int(os.environ.get("PORT", 8000))

# --- FastAPI app ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Download ONNX model if not exists ---
def download_model():
    if os.path.exists(MODEL_LOCAL_PATH) and os.path.getsize(MODEL_LOCAL_PATH) > 1000:
        print("✅ Model exists locally.")
        return
    if MODEL_URL is None:
        raise ValueError("MODEL_URL not set!")
    print("⬇️ Downloading ONNX model...")
    with requests.get(MODEL_URL, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(MODEL_LOCAL_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    print("✅ Model downloaded.")

# --- Load ONNX model ---
session = None
def load_model():
    global session
    download_model()
    session = ort.InferenceSession(MODEL_LOCAL_PATH, providers=["CPUExecutionProvider"])
    print("🚀 ONNX model loaded.")

# --- Preprocess image ---
def preprocess_image_pil(pil_img: Image.Image, size=640):
    pil_img = ImageOps.exif_transpose(pil_img)
    pil_img = remove(pil_img)  # rembg-lite ใช้ background removal
    pil_img = ImageOps.pad(pil_img.convert("RGB"), (size, size), method=Image.Resampling.LANCZOS)
    return pil_img

# --- Startup event ---
@app.on_event("startup")
async def startup_event():
    load_model()

# --- Helper ---
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
    np_img = np.array(img_pre).astype(np.float32) / 255.0
    np_img = np.transpose(np_img, (2, 0, 1))
    np_img = np.expand_dims(np_img, 0)

    # --- ONNX inference ---
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: np_img})

    # --- format result ---
    detections = []
    for det in outputs[0]:
        xyxy = det[:4].tolist()
        conf = float(det[4])
        cls = int(det[5])
        detections.append({"xyxy": xyxy, "conf": conf, "class": cls})

    return {"detections": detections}

# --- Run locally ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
