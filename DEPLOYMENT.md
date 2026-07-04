# Deployment Guide

## Prerequisites

- Docker Engine 24+ and Docker Compose v2+
- A Linux server with public IP or DNS
- A domain name (e.g., homesync.example.com)
- Reverse proxy: Caddy, Nginx, or Traefik
- SSL certificate (Let's Encrypt or similar)
- Git

## Steps

### 1. Clone and configure

```bash
git clone https://github.com/<your-username>/homesync.git
cd homesync
cp .env.example .env
```

Edit `.env` with production values.

### 2. Start the services

```bash
docker compose up -d
```

This starts:
- **homesync-api** on `127.0.0.1:8000` (internal only)
- **homesync-frontend** on `127.0.0.1:3100` (internal only)

### 3. Configure reverse proxy

Example with Nginx:

```nginx
server {
    listen 80;
    server_name homesync.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name homesync.example.com;

    ssl_certificate /etc/letsencrypt/live/homesync.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/homesync.example.com/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL

With Certbot:

```bash
sudo certbot --nginx -d homesync.example.com
```

### 5. Verify

Open `https://homesync.example.com` in a browser. You should see the login screen.

## Notes

- The frontend has no build step: static files are served directly by Nginx from the `app/` directory.
- React 18, React-DOM 18, and Babel standalone are self-hosted in `app/vendor/`.
- VAPID keys for push notifications are auto-generated on first start and stored in the database.
- The backend runs migrations automatically on startup.
