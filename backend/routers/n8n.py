from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from deps import get_db, verify_api_key
from models import Setting, Task, Completion
from datetime import date, timedelta
from logic.scheduling import calculate_next_date
from routers.stats import get_leaderboard

router = APIRouter(dependencies=[Depends(verify_api_key)])

@router.get("/tasks/due")
async def n8n_tasks_due(db: AsyncSession = Depends(get_db)):
    tomorrow = date.today() + timedelta(days=1)
    result = await db.execute(
        select(Task).where(
            and_(Task.next_due_date <= tomorrow, Task.is_active == True)
        )
    )
    tasks = result.scalars().all()
    return [{"id": t.id, "name": t.name, "next_due_date": t.next_due_date, "room_id": t.room_id, "frequency_days": t.frequency_days} for t in tasks]

@router.get("/stats/weekly")
async def n8n_stats_weekly(db: AsyncSession = Depends(get_db)):
    return await get_leaderboard(db)

@router.post("/tasks/{id}/complete")
async def n8n_complete_task(id: int, request: Request, db: AsyncSession = Depends(get_db)):
    vacation = await db.get(Setting, "vacation_mode")
    if vacation.value == "true":
        raise HTTPException(status_code=423, detail="Vacation mode active")
    
    task = await db.get(Task, id)
    if not task: raise HTTPException(status_code=404)

    # Logica semplificata per n8n (sempre automatica, 0 punti)
    task.next_due_date = calculate_next_date(date.today(), task.frequency_days, "real")
    task.last_modified_reason = "completed_automated"
    
    completion = Completion(
        task_id=id,
        user_id=None,
        was_automated=True,
        idempotency_key=f"n8n-{id}-{date.today()}"
    )
    db.add(completion)
    await db.commit()
    return {"status": "automated_success"}