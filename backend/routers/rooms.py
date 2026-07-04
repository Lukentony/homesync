from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_
from datetime import date
from typing import List
from deps import get_db
from models import Room, Task
from schemas import RoomRead, RoomBase

router = APIRouter()


@router.get("", response_model=List[RoomRead])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    """Get all active rooms with task completion percentages."""
    rooms_res = await db.execute(select(Room).where(Room.is_active == True).order_by(Room.sort_order))
    rooms = rooms_res.scalars().all()

    results = []
    today = date.today()
    for room in rooms:
        total_res = await db.execute(select(func.count(Task.id)).where(and_(Task.room_id == room.id, Task.is_active == True)))
        ok_res = await db.execute(select(func.count(Task.id)).where(and_(Task.room_id == room.id, Task.is_active == True, Task.next_due_date > today)))

        t_count = total_res.scalar() or 1
        ok_count = ok_res.scalar() or 0

        room_data = RoomRead.model_validate(room)
        room_data.completion_percentage = (ok_count / t_count) * 100
        results.append(room_data)

    return results


@router.post("", response_model=RoomRead)
async def create_room(payload: RoomBase, db: AsyncSession = Depends(get_db)):
    """Create a new room."""
    room = Room(
        name=payload.name,
        icon=payload.icon,
        sort_order=payload.sort_order,
        is_active=True,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    room_data = RoomRead.model_validate(room)
    room_data.completion_percentage = 0.0
    return room_data


@router.put("/{id}", response_model=RoomRead)
async def update_room(id: int, payload: RoomBase, db: AsyncSession = Depends(get_db)):
    """Update an existing room."""
    room = await db.get(Room, id)
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Stanza non trovata")

    room.name = payload.name
    room.icon = payload.icon
    room.sort_order = payload.sort_order

    await db.commit()
    await db.refresh(room)
    room_data = RoomRead.model_validate(room)
    room_data.completion_percentage = 0.0
    return room_data


@router.delete("/{id}")
async def delete_room(id: int, force: bool = Query(False), db: AsyncSession = Depends(get_db)):
    """Soft-delete a room. If force=True, also deactivates all tasks in the room."""
    room = await db.get(Room, id)
    if not room:
        raise HTTPException(status_code=404, detail="Stanza non trovata")

    active_tasks = await db.execute(select(Task).where(and_(Task.room_id == id, Task.is_active == True)))
    tasks = active_tasks.scalars().all()

    if tasks and not force:
        return {"status": "conflict", "tasks": [t.name for t in tasks]}

    if force:
        await db.execute(update(Task).where(Task.room_id == id).values(is_active=False))

    room.is_active = False
    await db.commit()
    return {"status": "deleted"}
