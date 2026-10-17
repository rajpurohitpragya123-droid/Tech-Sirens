"""Mock-first service. Never describes fixed demo output as image inference."""
import io
import os
from datetime import date, timedelta
from statistics import median
from typing import Annotated
import numpy as np
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

app = FastAPI(title="खेत Doctor ML", version="0.1.0")
LABELS = {"wheat": "leaf_rust", "rice": "bacterial_leaf_blight", "maize": "common_rust", "tomato": "early_blight", "potato": "late_blight", "onion": "purple_blotch", "cotton": "bacterial_blight", "sugarcane": "red_rot", "mustard": "alternaria_blight", "chilli": "anthracnose"}
DURATION = dict(zip(LABELS, [120, 130, 110, 120, 100, 120, 180, 360, 110, 150]))
RESIDUE = dict(zip(LABELS, [1.5, 1.4, 1.2, .5, .4, .3, 1.8, .3, 1.3, .5]))

def blur_variance(image: Image.Image) -> float:
    grey = np.asarray(image.convert("L").resize((256, 256)), dtype=float)
    laplacian = -4*grey[1:-1, 1:-1] + grey[:-2, 1:-1] + grey[2:, 1:-1] + grey[1:-1, :-2] + grey[1:-1, 2:]
    return float(laplacian.var())

@app.get("/health")
def health():
    return {"ok": True, "mode": "mock", "trained_model_loaded": False}

@app.post("/predict")
async def predict(image: Annotated[UploadFile, File()], crop: Annotated[str, Form()], lat: Annotated[float | None, Form(ge=-90, le=90)] = None, lon: Annotated[float | None, Form(ge=-180, le=180)] = None):
    if crop not in LABELS:
        raise HTTPException(422, "Supported crop required")
    if os.getenv("MOCK_MODE", "true").lower() != "true":
        raise HTTPException(503, "A validated trained model is not deployed. Explicit mock mode is required.")
    data = await image.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image must be under 8 MB")
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.width*source.height > 20_000_000:
                raise HTTPException(413, "Image dimensions are too large")
            blur = blur_variance(source)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(422, "A valid JPEG or PNG image is required")
    return {"predictions": [{"label": LABELS[crop], "confidence": .78}, {"label": "healthy", "confidence": .14}, {"label": "unknown", "confidence": .08}], "model_version": "fixed-mock-v1", "mock": True, "blur_variance": blur, "needs_clearer_photo": blur < 80, "explanation": "Fixed sample response. No image inference or weather reranking was performed.", "location_provided": lat is not None and lon is not None}

class StubbleRequest(BaseModel):
    crop: str
    acres: float = Field(gt=0, le=10000)
    yield_quintals_per_acre: float = Field(gt=0, le=1000)
    sowing_date: date

@app.post("/stubble-forecast")
def stubble_forecast(body: StubbleRequest):
    if body.crop not in DURATION:
        raise HTTPException(422, "Unknown crop")
    harvest = body.sowing_date + timedelta(days=DURATION[body.crop])
    return {"quintals": round(body.acres * body.yield_quintals_per_acre * RESIDUE[body.crop], 1), "harvest_start": harvest-timedelta(days=7), "harvest_end": harvest+timedelta(days=7), "confidence": .72, "method": "reference-table estimate, not a trained forecasting model", "mock": True}

class PriceHistory(BaseModel):
    weekly_prices: list[float] = Field(min_length=8, max_length=520)
    perishable_without_storage: bool = False

@app.post("/price-trend")
def price_trend(body: PriceHistory):
    if any(p <= 0 or not np.isfinite(p) for p in body.weekly_prices):
        raise HTTPException(422, "All historical prices must be positive and finite")
    prior = median(body.weekly_prices[-8:-4])
    recent = median(body.weekly_prices[-4:])
    return {"historical_change_percent": round((recent/prior-1)*100, 2), "suggestion": "sell_now" if body.perishable_without_storage else "compare_storage_costs", "confidence": "low", "notice": "Historical summary only; future prices are uncertain. No forecasting model is trained."}
