FROM python:3.11-slim

WORKDIR /app

# tzdata: senza, date.today() resta in UTC e le scadenze sbagliano di un giorno
# vicino a mezzanotte. Il fuso è configurabile via env TZ (default in config.env).
ENV TZ=Europe/Rome
RUN apt-get update && apt-get install -y curl sqlite3 tzdata && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# La directory /data verrà montata come volume esterno
RUN mkdir -p /data

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]