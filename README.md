# HomeSync

HomeSync è una PWA per la gestione condivisa dei task domestici, progettata per due persone (coinquilini, coppie).
Tiene traccia delle pulizie ricorrenti, assegna i compiti, calcola punteggi e mostra chi sta facendo la propria parte.

HomeSync is a PWA for shared household chore management, designed for two people (roommates, couples).
It tracks recurring tasks, assigns them, scores completion, and shows who is pulling their weight.

---

## Quick Start

```bash
git clone <repo-url>
cd homesync
cp .env.example .env
# modifica USER_A_TOKEN e USER_B_TOKEN (SHA-256 dei PIN scelti)
docker compose up -d
```

Accedi a `http://localhost:3100`. Il primo avvio esegue automaticamente le migrazioni del database e crea stanze e task di default.

## Project Structure

```
homesync/
├── backend/           # FastAPI app
│   ├── routers/       # tasks, users, rooms, stats, settings, n8n
│   ├── logic/         # scheduling, scoring, assignment, idempotency
│   ├── alembic/       # migrazioni database (001→011)
│   └── models.py      # ORM: User, Task, Room, Completion, Setting
├── app/               # Frontend (servito da nginx)
│   ├── index.html     # React app (JSX, nessun build step)
│   ├── lib/           # Componenti React
│   ├── lib-bridge/    # API client
│   ├── vendor/        # React 18, React-DOM 18, Babel 7.29 (self-hosted)
│   └── sw.js          # Service Worker (PWA + notifiche push)
├── scripts/           # docker-entrypoint, setup-runtime-config
├── docker-compose.yml
├── Dockerfile         # Nginx multi-stage
└── .env.example
```

## Stack

- **Backend**: FastAPI (async), SQLAlchemy 2.0, SQLite WAL
- **Frontend**: React 18 self-hosted (no CDN), JSX compilato in-browser da Babel standalone — nessun build step
- **Auth**: PIN numerico 4-6 cifre → SHA-256 → session token in localStorage
- **Push**: VAPID keys generate automaticamente al primo avvio e salvate nel DB
- **Container**: Docker, Docker Compose
- **UI**: solo italiano, non internazionalizzata

## Configuration

Tutte le variabili in `.env`:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Random hex string |
| `USER_A_TOKEN` | PIN hash (SHA-256) per utente A |
| `USER_B_TOKEN` | PIN hash (SHA-256) per utente B |
| `N8N_API_KEY` | Chiave per integrazione n8n (opzionale) |
| `DATABASE_URL` | Default: `sqlite+aiosqlite:///./data/homesync.db` |

## Known Limitations

- Limitato a due utenti
- UI solo in italiano (non i18n)
- Database SQLite (non pensato per carichi multi-request pesanti)
- Notifiche push funzionanti solo su HTTPS
- Il frontend senza build step significa che tutto il JSX viene compilato lato client — c'e' un breve flash al primo caricamento

## License

MIT
