import os
import hashlib
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import async_session
from models import User

async def get_db():
    async with async_session() as session:
        yield session

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Resolve user from Authorization header (Bearer <session_token>)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Sessione non valida o mancante"
        )
    
    token = authorization.replace("Bearer ", "", 1).strip()
    result = await db.execute(select(User).where(User.session_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Sessione scaduta o non valida"
        )
    return user