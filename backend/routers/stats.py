from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta, date
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

    # Punti settimanali: somma dei points_awarded da lunedì. I completamenti
    # "Insieme" (was_shared) assegnano la quota a ENTRAMBI, coerente con
    # complete_task — NON basta che il task sia TOGETHER: se dal picker
    # "Chi l'ha fatto?" e' stata scelta una persona specifica, i punti sono
    # solo suoi (was_shared=False per quel completamento), anche se il task
    # in se' e' di tipo TOGETHER (bug corretto il 2026-07-06, era
    # inconsistente con total_points che gia' seguiva questa regola).
    week_start = datetime.combine(
        date.today() - timedelta(days=date.today().weekday()),
        datetime.min.time()
    )
    weekly = {u.id: 0 for u in users}
    weekly_res = await db.execute(
        select(Completion.user_id, Completion.points_awarded, Completion.was_shared)
        .where(Completion.completed_at >= week_start)
    )
    for uid, pts, was_shared in weekly_res.all():
        pts = pts or 0
        if was_shared:
            for k in weekly:
                weekly[k] += pts
        elif uid in weekly:
            weekly[uid] += pts

    leaderboard = []
    for user in users:
        leaderboard.append({
            "user_id": user.id,
            "user_name": user.name,
            "emoji": user.emoji or "",
            "color": user.color or "",
            "weekly_points": weekly.get(user.id, 0),
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
            "completed_at": c[0].completed_at.isoformat(),
            "was_shared": bool(c[0].was_shared),
        }
        for c in completions
    ]

@router.delete("/history/{id}")
async def delete_history_item(
    id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific completion (by id) and reverse its effects.

    Agganciato al completamento specifico (non "l'ultimo in assoluto per
    quel task", come faceva l'endpoint gemello DELETE /tasks/{id}/complete
    prima del 2026-07-06 — cliccare "Annulla" su una voce dello Storico
    poteva cancellare un completamento diverso da quello su cui si era
    cliccato)."""
    completion = await db.get(Completion, id)
    if not completion:
        raise HTTPException(status_code=404, detail="Completamento non trovato")

    task = await db.get(Task, completion.task_id)

    # Rimuovi punti — anche se negativi: un ritardo >1g li aveva sottratti,
    # annullare il completamento li restituisce (niente filtro "> 0").
    if completion.points_awarded:
        c_user = await db.get(User, completion.user_id)
        if c_user:
            c_user.total_points = max(0, (c_user.total_points or 0) - completion.points_awarded)

        # Rimuovi punti condivisi SOLO se questo specifico completamento era
        # "Insieme" (was_shared) — non basta che il task sia TOGETHER: dal
        # 2026-07-06 scegliere una persona precisa nel picker da' i punti
        # pieni solo a lei, non piu' la quota a entrambi (vedi complete_task).
        if completion.was_shared:
            other_ids_res = await db.execute(select(User.id).where(User.id != completion.user_id))
            for oid in other_ids_res.scalars().all():
                other = await db.get(User, oid)
                if other:
                    other.total_points = max(0, (other.total_points or 0) - completion.points_awarded)

    # Se e' il completamento piu' recente di questo task, ripristina anche
    # la scadenza precedente (il task torna "da fare"). Non toccare
    # next_due_date se si sta cancellando una voce storica piu' vecchia:
    # la scadenza attuale e' stata determinata da un completamento
    # successivo, non da questo.
    if task and completion.previous_due_date:
        latest_res = await db.execute(
            select(Completion.id)
            .where(Completion.task_id == task.id)
            .order_by(desc(Completion.completed_at))
            .limit(1)
        )
        if latest_res.scalar_one_or_none() == completion.id:
            task.next_due_date = completion.previous_due_date
            task.last_modified_reason = "undo_completion"

    await db.delete(completion)
    await db.commit()
    return {"status": "deleted"}