from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from deps import get_db
from models import User

router = APIRouter()

@router.post("/verify")
async def verify_setup(user_id: int, token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(and_(User.id == user_id, User.onboarding_token == token))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Token non valido")
    return {"status": "ok", "user_name": user.name}