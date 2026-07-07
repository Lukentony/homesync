from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, delete, func
from datetime import date, datetime, timedelta
from typing import List, Optional
import random

from deps import get_db, get_current_user
from models import Task, Completion, User, Room, TaskOccurrenceOverride
from schemas import TaskRead, TaskBase, TaskCreate, CompletionCreate
from logic.scheduling import calculate_next_date, next_due_from_recurrence
from logic.assignment import determine_next_performer
from logic.scoring import calculate_points
from logic.idempotency import generate_key

router = APIRouter()


async def _apply_occurrence_overlay(tasks, db: AsyncSession) -> List[TaskRead]:
    """Costruisce i TaskRead da restituire applicando lo stato di scope "solo
    questa occorrenza": eccezione 'modified' per la scadenza corrente, elenco
    delle date 'skipped' passate, e il flag has_history (usato dal frontend
    per decidere se mostrare la scelta solo-questa/serie).
    Non modifica MAI le colonne reali degli oggetti Task tracciati dalla
    sessione: farlo rischierebbe un flush accidentale sul DB (lo stesso bug
    di riscrittura retroattiva già fixato in Fase 1), dato che questa
    funzione alimenta anche endpoint GET senza effetti collaterali. Costruisce
    invece TaskRead separati e sovrascrive solo quelli.
    I quick action sono esclusi dal meccanismo di override (nessuna vera
    occorrenza distinta) e passano invariati."""
    task_ids = [t.id for t in tasks if not t.is_quick_action]
    overrides_by_task = {}
    history_ids = set()
    if task_ids:
        overrides_res = await db.execute(
            select(TaskOccurrenceOverride).where(TaskOccurrenceOverride.task_id.in_(task_ids))
        )
        for o in overrides_res.scalars().all():
            overrides_by_task.setdefault(o.task_id, []).append(o)

        history_res = await db.execute(
            select(Completion.task_id).where(Completion.task_id.in_(task_ids)).distinct()
        )
        history_ids = set(history_res.scalars().all())

    out = []
    for t in tasks:
        read = TaskRead.model_validate(t)
        read.has_history = t.id in history_ids
        if not t.is_quick_action:
            for o in overrides_by_task.get(t.id, []):
                if o.status == "skipped":
                    read.skipped_occurrences.append(o.occurrence_date)
                elif o.status == "modified" and o.occurrence_date == t.next_due_date:
                    read.has_occurrence_override = True
                    if o.name is not None:
                        read.name = o.name
                    if o.room_id is not None:
                        read.room_id = o.room_id
                    if o.difficulty is not None:
                        read.difficulty = o.difficulty
        out.append(read)
    return out


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
    return await _apply_occurrence_overlay(tasks, db)


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
    return await _apply_occurrence_overlay(tasks, db)


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
async def update_task(
    id: int,
    payload: TaskBase,
    scope: str = Query("all", pattern="^(this|all)$"),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing task. scope=all (default) modifica la serie da ora
    in poi. scope=this (solo per task non quick-action) crea un'eccezione
    per la sola prossima occorrenza (nome/stanza/difficoltà), senza toccare
    la riga Task."""
    task = await db.get(Task, id)
    if not task or not task.is_active:
        raise HTTPException(status_code=404, detail="Task non trovato")

    room = await db.get(Room, payload.room_id)
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Stanza non trovata")

    is_qa = payload.is_quick_action or False

    if scope == "this" and not task.is_quick_action:
        existing_res = await db.execute(
            select(TaskOccurrenceOverride).where(
                and_(
                    TaskOccurrenceOverride.task_id == id,
                    TaskOccurrenceOverride.occurrence_date == task.next_due_date,
                )
            )
        )
        override = existing_res.scalar_one_or_none()
        if not override:
            override = TaskOccurrenceOverride(
                task_id=id,
                occurrence_date=task.next_due_date,
                status="modified",
            )
            db.add(override)
        override.status = "modified"
        override.name = payload.name if payload.name != task.name else None
        override.room_id = payload.room_id if payload.room_id != task.room_id else None
        override.difficulty = payload.difficulty if payload.difficulty != task.difficulty else None
        await db.commit()
        await db.refresh(task)
        return (await _apply_occurrence_overlay([task], db))[0]

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

    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{id}")
async def delete_task(
    id: int,
    scope: str = Query("all", pattern="^(this|all)$"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a task. scope=all (default) soft-elimina l'intera serie.
    scope=this (solo per task non quick-action) salta solo la prossima
    occorrenza: la riga Task resta attiva, next_due_date avanza secondo la
    ricorrenza, nessun Completion viene creato (l'occorrenza saltata non
    vale punti e non compare nello storico)."""
    task = await db.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato")

    if scope == "this" and not task.is_quick_action:
        existing_res = await db.execute(
            select(TaskOccurrenceOverride).where(
                and_(
                    TaskOccurrenceOverride.task_id == id,
                    TaskOccurrenceOverride.occurrence_date == task.next_due_date,
                )
            )
        )
        override = existing_res.scalar_one_or_none()
        if not override:
            override = TaskOccurrenceOverride(task_id=id, occurrence_date=task.next_due_date, status="skipped")
            db.add(override)
        override.status = "skipped"
        override.name = None
        override.room_id = None
        override.difficulty = None

        task.next_due_date = next_due_from_recurrence(task, task.next_due_date)
        task.last_modified_reason = "occurrence_skipped"
        await db.commit()
        return {"status": "occurrence_skipped", "next_due": task.next_due_date}

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
    today = date.today()

    # Eccezione "solo questa occorrenza" (scope=this su un edit precedente):
    # usa la difficoltà dell'override solo per questo completamento, poi la
    # consuma (mono-uso — una volta passata questa data non serve più).
    effective_difficulty = task.difficulty
    override = None
    if not task.is_quick_action:
        override_res = await db.execute(
            select(TaskOccurrenceOverride).where(
                and_(
                    TaskOccurrenceOverride.task_id == id,
                    TaskOccurrenceOverride.occurrence_date == task.next_due_date,
                    TaskOccurrenceOverride.status == "modified",
                )
            )
        )
        override = override_res.scalar_one_or_none()
        if override and override.difficulty is not None:
            effective_difficulty = override.difficulty

    # Regola di casa (sostituisce le penalità notturne dello scheduler):
    # - 1 giorno di ritardo  -> valore base a 1 (Facile 1, Medio 2, Difficile 3)
    # - >1 giorno di ritardo -> NON ridotto a 1: stesso valore che si sarebbe
    #   guadagnato puntuale (difficoltà × scoring_base normale), ma SOTTRATTO,
    #   cioè -(p × d). Va tenuto distinto dal caso a 1 giorno (dove p=1).
    delay_days = 0
    if not task.is_quick_action and task.next_due_date and task.next_due_date < today:
        delay_days = (today - task.next_due_date).days
        if delay_days == 1:
            scoring_base = 1
    # Punti: UNICA fonte di verità è il backend. Ignoriamo payload.points_awarded
    # (il client lo calcolava con una formula diversa -> divergenza display/DB).
    #
    # Un task TOGETHER e' condiviso (punti splittati) SOLO se e' stato
    # completato come "Insieme" (payload.user_id assente). Se dal picker
    # "Chi l'ha fatto?" e' stata scelta una persona specifica, quella
    # persona prende i punti PIENI, non la quota — anche se il task e'
    # TOGETHER (bug corretto il 2026-07-06: prima si splittava comunque,
    # contraddicendo l'anteprima gia' mostrata nel picker stesso).
    is_shared = (task.assignment_type == "TOGETHER") and (payload.user_id is None)
    points, _ = calculate_points(
        effective_difficulty,
        "TOGETHER" if is_shared else "INDIVIDUAL",
        num_users,
        scoring_base,
    )
    if delay_days > 1:
        points = -points

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
        was_shared=is_shared,
        previous_due_date=previous_due,
    )

    task.next_due_date = new_due_date
    task.last_modified_reason = "completed_theoretical" if payload.use_theoretical_date else "completed_real"

    if task.assignment_type == "ALTERNATING":
        task.last_performer_id = performer.id

    # Il totale non scende mai sotto zero (coerente col comportamento storico
    # delle penalità), anche quando points è negativo (ritardo >1 giorno).
    if is_shared:
        await db.execute(
            update(User).where(User.id.in_(active_ids)).values(
                total_points=func.max(0, User.total_points + points)
            )
        )
    else:
        performer.total_points = max(0, (performer.total_points or 0) + points)

    db.add(completion)
    if override:
        await db.delete(override)
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
        
        # Solo se questo completamento era "Insieme" (was_shared) i punti
        # vanno tolti anche all'altro utente — non basta che il task sia
        # TOGETHER (vedi complete_task, 2026-07-06).
        if completion.was_shared:
            other_ids_res = await db.execute(select(User.id).where(User.id != completion.user_id))
            for oid in other_ids_res.scalars().all():
                other = await db.get(User, oid)
                if other:
                    other.total_points = max(0, (other.total_points or 0) - completion.points_awarded)

    await db.delete(completion)
    await db.commit()
    return {"status": "undone"}


@router.post("/reset-test")
async def reset_test(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """Ripristina i task alla scadenza di oggi e cancella tutti i completamenti.

    Endpoint dietro autenticazione (dependencies=_auth su tutto il router),
    usato dal pulsante 'Ripristina dati di default' in Impostazioni.
    """
    today = date.today()
    await db.execute(update(Task).where(and_(Task.is_active == True, Task.is_quick_action == False)).values(next_due_date=today, last_modified_reason="test_reset"))
    await db.execute(delete(Completion))
    await db.execute(update(User).values(total_points=0))
    await db.commit()
    return {"status": "reset"}


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
