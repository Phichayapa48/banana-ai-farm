import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from rembg import remove
import onnxruntime as ort
import numpy as np

# --- Config ---
MODEL_URL = os.environ.get("MODEL_URL")
MODEL_LOCAL_PATH = os.environ.get("MODEL_LOCAL_PATH", "best_model.onnx")
PORT = int(os.environ.get("PORT", 8000))
MAX_UPLOAD_MB = 5  # limit upload size

# --- FastAPI app ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model placeholder ---
session = None

# --- Download model ---
def download_model_if_needed():
    if MODEL_URL is None:
        raise ValueError("❌ MODEL_URL not set!")
    if os.path.exists(MODEL_LOCAL_PATH) and os.path.getsize(MODEL_LOCAL_PATH) > 1000:
        print("✅ Model exists")
        return
    import requests
    print("⬇️ Downloading model...")
    with requests.get(MODEL_URL, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(MODEL_LOCAL_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    print("✅ Download complete")

# --- Load model ---
def load_model():
    global session
    if session is None:
        download_model_if_needed()
        session = ort.InferenceSession(MODEL_LOCAL_PATH)
        print("🚀 ONNX loaded")

# --- Preprocess image (resize + remove bg) ---
def preprocess_image(pil_img: Image.Image, size=640):
    pil_img = ImageOps.exif_transpose(pil_img)
    pil_img = ImageOps.pad(pil_img.convert("RGB"), (size, size), method=Image.Resampling.LANCZOS)
    try:
        pil_img = remove(pil_img)
    except Exception as e:
        print("⚠️ rembg failed:", e)
    return pil_img

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    load_model()

# --- Convert bytes -> PIL ---
def bytes_to_pil(b: bytes):
    return Image.open(io.BytesIO(b))

# --- Detection endpoint ---
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(400, "File must be an image")
    
    if file.spool_max_size > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"Max upload size {MAX_UPLOAD_MB} MB exceeded")
    
    contents = await file.read()
    img = bytes_to_pil(contents).convert("RGB")
    img_pre = preprocess_image(img, size=640)
    
    np_img = np.array(img_pre).astype(np.float32) / 255.0
    input_tensor = np.transpose(np_img, (2, 0, 1))[None, :, :, :]
    
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})
    
    detections = outputs[0].tolist() if len(outputs) > 0 else []
    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
