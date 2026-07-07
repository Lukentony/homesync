import hashlib
import hmac
import os
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from deps import get_db, get_current_user
from limiter import limiter
from models import User
from schemas import UserRename, UserCreate, UserPatch, UserLogin, LoginResponse

router = APIRouter()

# HomeSync is designed for exactly 2 household members
MAX_USERS = 2


def _hash_pin(pin: str) -> str:
    """Hash a PIN with scrypt (memory-hard KDF, salt included in output)."""
    salt = os.urandom(16)
    key = hashlib.scrypt(pin.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
    return "scrypt:" + salt.hex() + ":" + key.hex()


def _verify_pin(pin: str, stored_hash: str) -> bool:
    """Constant-time PIN verification. Supports scrypt (new) and SHA-256 (legacy)."""
    if stored_hash.startswith("scrypt:"):
        try:
            _, salt_hex, key_hex = stored_hash.split(":", 2)
            salt = bytes.fromhex(salt_hex)
            computed = hashlib.scrypt(pin.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)
            return hmac.compare_digest(computed, bytes.fromhex(key_hex))
        except Exception:
            return False
    # Legacy SHA-256 fallback for existing hashes
    computed = hashlib.sha256(pin.encode()).hexdigest()
    return hmac.compare_digest(computed.encode(), stored_hash.encode())


@router.get("", response_model=List[dict])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all users (public, used for login picker)."""
    result = await db.execute(select(User).order_by(User.id.asc()))
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "emoji": u.emoji or "🦦",
            "color": u.color or "#E2743A",
            "total_points": u.total_points,
            "notification_morning_time": u.notification_morning_time,
            "notification_evening_time": u.notification_evening_time
        }
        for u in users
    ]


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
async def login_user(request: Request, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user with PIN and return a session token."""
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if user.pin_hash:
        if not _verify_pin(payload.pin or "", user.pin_hash):
            raise HTTPException(status_code=401, detail="PIN non valido")
    # If no PIN is configured, login is allowed directly (household app, optional PIN by design)

    # Token stabile per utente: ruotarlo a ogni login sconnetteva gli altri
    # dispositivi dello stesso utente (401 -> re-login -> 401 sull'altro, a catena).
    if not user.session_token:
        user.session_token = secrets.token_hex(32)
        await db.commit()

    return {
        "status": "success",
        "session_token": user.session_token,
        "user_id": user.id,
        "user_name": user.name
    }


@router.post("", response_model=dict)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user. Limited to MAX_USERS (household app, initial setup only)."""
    existing = await db.execute(select(User))
    if len(existing.scalars().all()) >= MAX_USERS:
        raise HTTPException(status_code=403, detail="Numero massimo di utenti raggiunto")

    token = secrets.token_hex(16)
    pin_hash = _hash_pin(payload.pin) if payload.pin else None

    user = User(
        name=payload.name,
        emoji=payload.emoji or "🦦",
        color=payload.color or "#E2743A",
        onboarding_token=token,
        pin_hash=pin_hash,
        total_points=0
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"status": "created", "user_id": user.id, "name": user.name}


@router.patch("/{id}", response_model=dict)
async def patch_user(
    id: int,
    payload: UserPatch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user profile settings (protected)."""
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Non autorizzato a modificare questo profilo")

    user = await db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.emoji is not None:
        user.emoji = payload.emoji.strip()
    if payload.color is not None:
        user.color = payload.color.strip()
    if payload.notification_morning_time is not None:
        user.notification_morning_time = payload.notification_morning_time.strip()
    if payload.notification_evening_time is not None:
        user.notification_evening_time = payload.notification_evening_time.strip()
    if payload.push_subscription is not None:
        user.push_subscription = payload.push_subscription or None
    if payload.pin is not None:
        if payload.pin == "":
            user.pin_hash = None
        else:
            user.pin_hash = _hash_pin(payload.pin)

    await db.commit()
    return {"status": "success", "user_id": user.id}


@router.patch("/{id}/name", response_model=dict)
async def rename_user(
    id: int,
    payload: UserRename,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename user (protected)."""
    if current_user.id != id:
        raise HTTPException(status_code=403, detail="Non autorizzato")

    user = await db.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    user.name = payload.name.strip()
    await db.commit()
    return {"status": "success", "user_id": user.id, "new_name": user.name}
