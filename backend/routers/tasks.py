import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, delete
from datetime import date, datetime, timedelta
from typing import List, Optional
import random

from deps import get_db, get_current_user
from models import Task, Completion, User, Room
from schemas import TaskRead, TaskBase, TaskCreate, CompletionCreate
from logic.scheduling import calculate_next_date, next_due_from_recurrence
from logic.assignment import determine_next_performer
from logic.scoring import calculate_points
from logic.idempotency import generate_key


router = APIRouter()


@router.get("", response_model=List[TaskRead])
async def get_all_tasks(db: AsyncSession = Depends(get_db)):
    """Get all active tasks (excluding quick actions) ordered by due date."""
    users_res = await db.execute(select(User.id).order_by(User.id.asc()))
    active_user_ids = [uid for uid in users_res.scalars().all()]

    result = await db.execute(
        select(Task).where(and_(Task.is_active == True, Task.is_quick_action == False)).order_by(Task.next_due_date.asc())
    )
    tasks = result.scalars().all()
    for t in tasks:
        t.assigned_user_id = determine_next_performer(
            t.assignment_type, t.last_performer_id, active_user_ids, t.fixed_user_id
        )
    return tasks


@router.get("/due", response_model=List[TaskRead])
async def get_due_tasks(
    days: Optional[int] = Query(None, description="Filtra task scadenti nei prossimi N giorni"),
    db: AsyncSession = Depends(get_db)
):
    """Get active tasks (excluding quick actions) ordered by urgency. Optional ?days=N to limit horizon."""
    users_res = await db.execute(select(User.id).order_by(User.id.asc()))
    active_user_ids = [uid for uid in users_res.scalars().all()]

    query = select(Task).where(and_(Task.is_active == True, Task.is_quick_action == False))
    if days is not None:
        cutoff = date.today() + timedelta(days=days)
        query = query.where(Task.next_due_date <= cutoff)
    result = await db.execute(query.order_by(Task.next_due_date.asc()))
    tasks = result.scalars().all()
    for t in tasks:
        t.assigned_user_id = determine_next_performer(
            t.assignment_type, t.last_performer_id, active_user_ids, t.fixed_user_id
        )
    return tasks


@router.get("/quick-actions", response_model=List[TaskRead])
async def get_quick_actions(db: AsyncSession = Depends(get_db)):
    """Get all active quick action tasks."""
    result = await db.execute(
        select(Task).where(and_(Task.is_active == True, Task.is_quick_action == True)).order_by(Task.name.asc())
    )
    return result.scalars().all()


@router.post("", response_model=TaskRead)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_db)):
    """Create a new task."""
    room = await db.get(Room, payload.room_id)
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Stanza non trovata")

    is_qa = payload.is_quick_action or False
    task = Task(
        name=payload.name,
        room_id=payload.room_id,
        frequency_days=9999 if is_qa else payload.frequency_days,
        grace_period_days=0 if is_qa else (payload.grace_period_days or 0),
        assignment_type="TOGETHER" if is_qa else payload.assignment_type,
        fixed_user_id=None if is_qa else payload.fixed_user_id,
        difficulty=payload.difficulty,
        tags=payload.tags,
        next_due_date=date(9999, 12, 31) if is_qa else (payload.initial_due_date or (date.today() + timedelta(days=payload.frequency_days))),
        last_modified_reason="created",
        is_active=True,
        is_quick_action=is_qa,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.put("/{id}", response_model=TaskRead)
async def update_task(id: int, payload: TaskBase, db: AsyncSession = Depends(get_db)):
    """Update an existing task."""
    task = await db.get(Task, id)
    if not task or not task.is_active:
        raise HTTPException(status_code=404, detail="Task non trovato")

    room = await db.get(Room, payload.room_id)
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Stanza non trovata")

    old_diff = task.difficulty
    new_diff = payload.difficulty
    is_qa = payload.is_quick_action or False

    task.name = payload.name
    task.room_id = payload.room_id
    task.frequency_days = 9999 if is_qa else payload.frequency_days
    task.grace_period_days = 0 if is_qa else (payload.grace_period_days or 0)
    task.assignment_type = "TOGETHER" if is_qa else payload.assignment_type
    task.fixed_user_id = None if is_qa else payload.fixed_user_id
    task.difficulty = payload.difficulty
    task.tags = payload.tags
    task.is_quick_action = is_qa
    task.last_modified_reason = "updated"
    if is_qa:
        task.next_due_date = date(9999, 12, 31)

    # Allinea retroattivamente le completion delle ultime 30 completion alla difficoltà e scoring_base correnti
    import math
    since = datetime.utcnow() - timedelta(days=30)
    completions_res = await db.execute(
        select(Completion).where(
            and_(
                Completion.task_id == id,
                Completion.completed_at >= since
            )
        )
    )
    completions = completions_res.scalars().all()
    for completion in completions:
        old_pts = completion.points_awarded
        is_shared = (task.assignment_type == "TOGETHER")
        base_pts = new_diff * (payload.scoring_base or 10)
        users_res = await db.execute(select(User.id))
        active_ids = [uid for uid in users_res.scalars().all()]
        num_users = len(active_ids)
        new_pts = math.ceil(base_pts / max(1, num_users)) if is_shared else base_pts
        diff = new_pts - old_pts
        if diff != 0:
            completion.points_awarded = new_pts
            if task.assignment_type == "TOGETHER":
                await db.execute(update(User).where(User.id.in_(active_ids)).values(total_points=User.total_points + diff))
            else:
                if completion.user_id:
                    u = await db.get(User, completion.user_id)
                    if u:
                        u.total_points = max(0, (u.total_points or 0) + diff)

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{id}")
async def delete_task(id: int, db: AsyncSession = Depends(get_db)):
    """Soft-delete a task (sets is_active=False)."""
    task = await db.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")
    task.is_active = False
    task.last_modified_reason = "deleted"
    await db.commit()
    return {"status": "deleted"}


@router.post("/{id}/complete")
async def complete_task(
    id: int,
    payload: CompletionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a task as completed."""
    task = await db.get(Task, id)
    if not task or not task.is_active:
        raise HTTPException(status_code=404, detail="Task non trovato")

    # Determina chi ha effettivamente completato il task (multi-utente da stesso PC)
    performer = user
    if payload.user_id is not None:
        db_user = await db.get(User, payload.user_id)
        if db_user:
            performer = db_user

    idem_key = generate_key(task.id, performer.id, task.assignment_type)
    
    # Per le quick action saltiamo idempotency key fissa per consentire completamenti consecutivi ravvicinati
    if task.is_quick_action:
        idem_key = f"qa-{task.id}-{performer.id}-{datetime.utcnow().timestamp()}-{random.random()}"

    existing = await db.execute(select(Completion).where(Completion.idempotency_key == idem_key))
    if existing.scalar_one_or_none():
        return {"status": "already_completed", "idempotency": True}

    users_res = await db.execute(select(User.id))
    active_ids = [uid for uid in users_res.scalars().all()]
    num_users = len(active_ids)
    from models import Setting
    scoring_base_s = await db.get(Setting, "scoring_base")
    scoring_base = int(scoring_base_s.value) if scoring_base_s else 10
    # Punti: UNICA fonte di verità è il backend. Ignoriamo payload.points_awarded
    # (il client lo calcolava con una formula diversa -> divergenza display/DB).
    points, is_shared = calculate_points(task.difficulty, task.assignment_type, num_users, scoring_base)

    today = date.today()
    if task.is_quick_action:
        new_due_date = date(9999, 12, 31)
    else:
        # Scadenza calcolata dal backend secondo il tipo di ricorrenza del task
        # (giorni fissi day: oppure intervallo frequency_days). Niente ricalcolo lato client.
        base = task.next_due_date if payload.use_theoretical_date else today
        new_due_date = next_due_from_recurrence(task, base)

    previous_due = task.next_due_date

    completion = Completion(
        task_id=task.id,
        user_id=performer.id,
        idempotency_key=idem_key,
        points_awarded=points,
        used_theoretical_date=payload.use_theoretical_date,
        was_on_demand=task.is_quick_action,
        previous_due_date=previous_due,
    )

    task.next_due_date = new_due_date
    task.last_modified_reason = "completed_theoretical" if payload.use_theoretical_date else "completed_real"

    if task.assignment_type == "ALTERNATING":
        task.last_performer_id = performer.id

    if is_shared:
        await db.execute(update(User).where(User.id.in_(active_ids)).values(total_points=User.total_points + points))
    else:
        performer.total_points = (performer.total_points or 0) + points

    db.add(completion)
    await db.commit()
    return {"status": "ok", "points": points, "next_due": new_due_date}


@router.delete("/{id}/complete")
async def undo_complete(
    id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Undo the last completion of a task."""
    task = await db.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")

    last_completion = await db.execute(
        select(Completion)
        .where(Completion.task_id == id)
        .order_by(Completion.completed_at.desc())
        .limit(1)
    )
    completion = last_completion.scalar_one_or_none()
    if not completion:
        raise HTTPException(status_code=404, detail="Nessun completamento da annullare")

    if completion.previous_due_date:
        task.next_due_date = completion.previous_due_date
        task.last_modified_reason = "undo_completion"

    user_res = await db.get(User, completion.user_id)
    if user_res and completion.points_awarded:
        user_res.total_points = max(0, (user_res.total_points or 0) - completion.points_awarded)
        
        if task.assignment_type == "TOGETHER":
            other_ids_res = await db.execute(select(User.id).where(User.id != completion.user_id))
            for oid in other_ids_res.scalars().all():
                other = await db.get(User, oid)
                if other:
                    other.total_points = max(0, (other.total_points or 0) - completion.points_awarded)

    await db.delete(completion)
    await db.commit()
    return {"status": "undone"}


@router.post("/{id}/complete-ondemand")
async def complete_on_demand(
    id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Complete a task on-demand (no points, no schedule change)."""
    task = await db.get(Task, id)
    if not task or not task.is_active:
        raise HTTPException(status_code=404, detail="Task non trovato")
    completion = Completion(
        task_id=id,
        user_id=user.id,
        was_on_demand=True,
        points_awarded=0,
        idempotency_key=f"ondemand-{id}-{datetime.utcnow().timestamp()}"
    )
    db.add(completion)
    await db.commit()
    return {"status": "ok"}
