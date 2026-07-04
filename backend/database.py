import os
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

DB_PATH = os.getenv("DATABASE_PATH", "/data/homesync.db")
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def init_db_settings(session: AsyncSession):
    # Performance SQLite per accessi concorrenti (WAL)
    await session.execute(text("PRAGMA journal_mode=WAL"))
    await session.execute(text("PRAGMA synchronous=NORMAL"))
    
    # Inserimento impostazioni di default (ignorando i conflitti)
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('pref_show_urgency_colors', 'true')"))
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('pref_early_completion_days', '2')"))
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('pref_grace_period_days', '1')"))
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('widgets_order', 'leaderboard,urgent,calendar')"))
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('widgets_hidden', '')"))
    await session.execute(text("INSERT OR IGNORE INTO settings (key, value) VALUES ('scoring_base', '3')"))
    
    # Verifica e generazione chiavi VAPID per Web Push
    from logic.push import generate_vapid_keys
    res_pub = await session.execute(text("SELECT value FROM settings WHERE key='vapid_public_key'"))
    pub_key = res_pub.scalar()
    if not pub_key:
        pub, priv = generate_vapid_keys()
        if pub and priv:
            await session.execute(text("INSERT OR REPLACE INTO settings (key, value) VALUES ('vapid_public_key', :v)").bindparams(v=pub))
            await session.execute(text("INSERT OR REPLACE INTO settings (key, value) VALUES ('vapid_private_key', :v)").bindparams(v=priv))
            await session.execute(text("INSERT OR REPLACE INTO settings (key, value) VALUES ('vapid_claims_email', 'luca@homesync.local')"))
    
    # Inserimento utenti Lu e Luca (con onboarding_token obbligatorio)
    await session.execute(text("INSERT OR IGNORE INTO users (id, name, onboarding_token, total_points) VALUES (1, 'Lu', 'token_lu_initial', 0)"))
    await session.execute(text("INSERT OR IGNORE INTO users (id, name, onboarding_token, total_points) VALUES (2, 'Luca', 'token_luca_initial', 0)"))

    await session.commit()
