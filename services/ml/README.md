# ML reference service

`python -m pip install -r services/ml/requirements.txt`, then `python -m uvicorn main:app --app-dir services/ml --port 8000`.

`POST /predict`: multipart `image`, `crop`, optional `lat`/`lon`. Validates size and image decoding, computes Laplacian blur variance, returns explicitly fixed mock predictions. Nonmock mode returns 503 until a reviewed inference provider is implemented. `/price-trend` summarizes historical windows; `/stubble-forecast` uses reference durations and residue factors. Neither is a trained forecast.

Reference `train.py`, `evaluate.py`, `export.py` require separately installed `torch`, `torchvision`, `scikit-learn`, `onnx`. PlantVillage and expert-labelled field datasets are not bundled. Split by source field/farmer before augmentation to avoid train/test leakage. Use `train.py --data dataset --output models`, then `evaluate.py --data dataset/test --model models`, then `export.py --model models`. Random-background augmentation, calibrated unknown rejection, weather-context reranking, retraining orchestration, TFLite export and field validation remain outstanding. No accuracy or inference-latency claim is made.
