from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta
from typing import List
from deps import get_db, get_current_user
from models import User, Completion, Task
from schemas import StatsResponse

router = APIRouter()

@router.get("/leaderboard", response_model=StatsResponse)
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get global leaderboard ordered by total points."""
    users_res = await db.execute(select(User).order_by(desc(User.total_points)))
    users = users_res.scalars().all()
    
    leaderboard = []
    for user in users:
        leaderboard.append({
            "user_id": user.id,
            "user_name": user.name,
            "emoji": user.emoji or "",
            "color": user.color or "",
            "weekly_points": 0,  # Settimanale rimosso
            "total_points": user.total_points or 0
        })

    return {
        "leaderboard": leaderboard
    }

@router.get("/history")
async def get_history(days: int = Query(30), db: AsyncSession = Depends(get_db)):
    """Get completion history for the last N days"""
    since = datetime.utcnow() - timedelta(days=days)

    completions_res = await db.execute(
        select(Completion, Task, User)
        .join(Task, Task.id == Completion.task_id)
        .outerjoin(User, User.id == Completion.user_id)
        .where(Completion.completed_at >= since)
        .order_by(desc(Completion.completed_at))
    )

    completions = completions_res.all()

    return [
        {
            "id": c[0].id,
            "task_id": c[1].id,
            "task_name": c[1].name,
            "user_name": c[2].name if c[2] else "automatico",
            "points_awarded": c[0].points_awarded,
            "completed_at": c[0].completed_at.isoformat()
        }
        for c in completions
    ]

@router.delete("/history/{id}")
async def delete_history_item(
    id: int, 
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific history entry and subtract points."""
    completion = await db.get(Completion, id)
    if not completion:
        raise HTTPException(status_code=404, detail="Completamento non trovato")
    
    # Rimuovi punti
    if completion.points_awarded and completion.points_awarded > 0:
        c_user = await db.get(User, completion.user_id)
        if c_user:
            c_user.total_points = max(0, (c_user.total_points or 0) - completion.points_awarded)
            
        # Rimuovi punti condivisi se task era TOGETHER
        task = await db.get(Task, completion.task_id)
        if task and task.assignment_type == "TOGETHER":
            other_ids_res = await db.execute(select(User.id).where(User.id != completion.user_id))
            for oid in other_ids_res.scalars().all():
                other = await db.get(User, oid)
                if other:
                    other.total_points = max(0, (other.total_points or 0) - completion.points_awarded)
                
    await db.delete(completion)
    await db.commit()
    return {"status": "deleted"}