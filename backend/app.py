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
IMG_SIZE = int(os.environ.get("IMG_SIZE", 640))  # ถ้าต้องการปรับได้จาก env

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

# --- Load model (CPU provider explicitly) ---
def load_model():
    global session
    if session is None:
        download_model_if_needed()
        # บังคับให้ใช้ CPUExecutionProvider เพื่อลด GPU discovery warnings
        session = ort.InferenceSession(MODEL_LOCAL_PATH, providers=["CPUExecutionProvider"])
        print("🚀 ONNX loaded (CPU)")

# --- Preprocess image (resize -> remove bg) ---
def preprocess_image(pil_img: Image.Image, size=IMG_SIZE):
    pil_img = ImageOps.exif_transpose(pil_img)
    pil_img = ImageOps.pad(pil_img.convert("RGB"), (size, size), method=Image.Resampling.LANCZOS)
    try:
        pil_img = remove(pil_img)
    except Exception as e:
        print("⚠️ rembg failed:", e)
    return pil_img

# --- Startup: optional light log ---
@app.on_event("startup")
async def startup_event():
    print(f"🚀 Starting app on port {PORT}")

# --- Convert bytes -> PIL ---
def bytes_to_pil(b: bytes):
    return Image.open(io.BytesIO(b))

# --- Detection endpoint ---
@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    # content-type check
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(400, "File must be an image")

    # read contents first (then check size)
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"Max upload size {MAX_UPLOAD_MB} MB exceeded")

    # ensure model loaded (lazy load for memory safety)
    if session is None:
        load_model()

    img = bytes_to_pil(contents).convert("RGB")
    img_pre = preprocess_image(img, size=IMG_SIZE)

    np_img = np.array(img_pre).astype(np.float32) / 255.0
    input_tensor = np.transpose(np_img, (2, 0, 1))[None, :, :, :]

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})

    detections = outputs[0].tolist() if len(outputs) > 0 else []
    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    print(f"🟢 Uvicorn running on 0.0.0.0:{PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
