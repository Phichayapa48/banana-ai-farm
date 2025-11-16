from fastapi import FastAPI
import torch
import requests

app = FastAPI()

MODEL_URL = "https://YOUR_SUPABASE_URL/storage/v1/object/public/model/best.pt"

# โหลดโมเดลจาก Supabase
def load_model():
    response = requests.get(MODEL_URL)
    with open("best.pt", "wb") as f:
        f.write(response.content)
    model = torch.hub.load('ultralytics/yolov8', 'custom', path='best.pt')
    return model

model = load_model()

@app.post("/predict")
async def predict(image: bytes):
    # ใช้ model.predict ทำงานกับ image
    return {"result": "predicted_label"}
