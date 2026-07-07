# Install Guide

## Requirements

- Docker Engine 24+
- Docker Compose v2+
- Git

## Installation

```bash
git clone https://github.com/<your-username>/homesync.git
cd homesync
cp .env.example .env
```

Edit `.env` and set at minimum:
- `SECRET_KEY`: a random hex string (`openssl rand -hex 32`)
- `USER_A_NAME` / `USER_B_NAME`: display names for the two household members

Then start the services:

```bash
docker compose up -d
```

The database migrations run automatically on first start. The frontend is available at `http://localhost:3100`.

## Verify

```bash
curl http://localhost:8000/health
# should return: ok
```

Open `http://localhost:3100` in a browser. Pick your user from the list to log in — no PIN is required by default. A PIN can be set later per-user from Settings.

## First Run

On first start, the app creates 8 default rooms and a set of canonical tasks.
