import os
import subprocess
import asyncio
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

from database import engine, async_session, init_db_settings
from deps import get_current_user
from routers import tasks, rooms, stats, settings, setup, users
from logic.scheduler import notification_scheduler_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Esegue migrazioni Alembic all'avvio
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        app.state.db_ready = True
    except Exception as e:
        print(f"Migration Error: {e}")
        app.state.db_ready = False
    
    async with async_session() as session:
        await init_db_settings(session)
        await session.commit()
        
    # Avvia lo scheduler in background
    scheduler_task = asyncio.create_task(notification_scheduler_loop())
    yield
    # Ferma lo scheduler
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()

app = FastAPI(title=os.getenv("APP_NAME", "HomeSync"), lifespan=lifespan, redirect_slashes=False)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    os.getenv("PUBLIC_BASE_URL", ""),
    os.getenv("INTERNAL_BASE_URL", "")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    if not getattr(app.state, "db_ready", False):
        return JSONResponse(status_code=503, content={"status": "migrating", "db": "busy"})
    return {"status": "ok", "db": "ready"}

# Auth: gli endpoint dati richiedono un session_token (Bearer). Restano pubblici
# solo i router pre-login: users (GET lista per il picker, POST /login) e setup,
# piu' /health. Il frontend allega il token e si ri-autentica sui 401 (senza PIN).
_auth = [Depends(get_current_user)]
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"], dependencies=_auth)
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"], dependencies=_auth)
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"], dependencies=_auth)
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"], dependencies=_auth)
app.include_router(setup.router, prefix="/api/setup", tags=["Setup"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
