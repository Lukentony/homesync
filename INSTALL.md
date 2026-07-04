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
- `USER_A_TOKEN`: SHA-256 hash of the PIN for user A
- `USER_B_TOKEN`: SHA-256 hash of the PIN for user B

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

Open `http://localhost:3100` in a browser. You will be prompted to enter your PIN.

## First Run

On first start, the app creates 8 default rooms and a set of canonical tasks.
Both users must be invited via the setup links printed in the logs:

```bash
docker compose logs homesync-api | grep setup
```
