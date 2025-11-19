import os
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps
from rembg.bg import remove
import onnxruntime as ort
import numpy as np

# --- Config ---
MODEL_URL = os.environ.get("MODEL_URL")
MODEL_LOCAL_PATH = os.environ.get("MODEL_LOCAL_PATH", "best_model.onnx")
PORT = int(os.environ.get("PORT", 8000))
MAX_UPLOAD_MB = 5

# --- Use lightweight Rembg model ---
os.environ["RMBG_MODEL"] = "u2netp"

session = None

# --- Download model ---
def download_model_if_needed():
    if not MODEL_URL:
        raise ValueError("MODEL_URL not set")

    if os.path.exists(MODEL_LOCAL_PATH) and os.path.getsize(MODEL_LOCAL_PATH) > 1000:
        print("✅ Model already exists")
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

# --- Load ONNX model ---
def load_model():
    global session
    if session is None:
        download_model_if_needed()
        session = ort.InferenceSession(
            MODEL_LOCAL_PATH,
            providers=["CPUExecutionProvider"]
        )
        print("🚀 Model loaded on CPU")

# --- FastAPI app ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Banana Model API running", "status": "ok"}

def preprocess_image(pil_img: Image.Image):
    # Keep original resolution, just convert to RGB and remove background
    pil_img = ImageOps.exif_transpose(pil_img)
    pil_img = pil_img.convert("RGB")
    try:
        pil_img = remove(pil_img)
    except Exception as e:
        print("⚠️ rembg failed:", e)
    return pil_img

def bytes_to_pil(b):
    return Image.open(io.BytesIO(b))

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(400, "File must be an image")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"Max upload size exceeded ({MAX_UPLOAD_MB}MB)")

    if session is None:
        load_model()

    img = bytes_to_pil(contents)
    img_pre = preprocess_image(img)

    arr = np.array(img_pre).astype(np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))[None, :, :, :]

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: arr})

    detections = outputs[0].tolist() if len(outputs) > 0 else []

    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    print(f"Running on port {PORT}")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
