FROM python:3.13-slim
WORKDIR /app
COPY services/ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ml/ .
USER 65534:65534
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
