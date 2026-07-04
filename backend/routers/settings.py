from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List
from deps import get_db
from models import Setting
from schemas import VacationToggle, PreferencesUpdate, WidgetsUpdate
from logic.scheduling import apply_vacation_reset

router = APIRouter()

@router.get("/scoring-base")
async def get_scoring_base(db: AsyncSession = Depends(get_db)):
    s = await db.get(Setting, "scoring_base")
    return {"base": int(s.value) if s else 3}

@router.patch("/scoring-base")
async def set_scoring_base(base: int, db: AsyncSession = Depends(get_db)):
    s = await db.get(Setting, "scoring_base")
    if s:
        s.value = str(max(1, min(10, base)))
    else:
        from sqlalchemy import text
        await db.execute(text("INSERT INTO settings (key, value) VALUES ('scoring_base', :v)").bindparams(v=str(max(1, min(10, base)))))
    await db.commit()
    return {"status": "ok", "base": max(1, min(10, base))}

@router.get("/vapid-public-key")
async def get_vapid_public_key(db: AsyncSession = Depends(get_db)):
    """Get the public VAPID key for web push subscriptions"""
    key = await db.get(Setting, "vapid_public_key")
    if not key:
        raise HTTPException(status_code=404, detail="Chiave pubblica VAPID non configurata")
    return {"public_key": key.value}

@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get all settings as a list of key-value pairs"""
    settings_res = await db.execute(select(Setting))
    settings = settings_res.scalars().all()
    return [{"key": s.key, "value": s.value} for s in settings]

@router.patch("/preferences")
async def update_preferences(payload: PreferencesUpdate, db: AsyncSession = Depends(get_db)):
    pref_show = await db.get(Setting, "pref_show_urgency_colors")
    if pref_show: pref_show.value = payload.show_urgency_colors
    
    pref_early = await db.get(Setting, "pref_early_completion_days")
    if pref_early: pref_early.value = payload.early_completion_days
    
    pref_grace = await db.get(Setting, "pref_grace_period_days")
    if pref_grace: pref_grace.value = payload.grace_period_days
    
    await db.commit()
    return {"status": "success"}

@router.get("/widgets")
async def get_widgets(db: AsyncSession = Depends(get_db)):
    order = await db.get(Setting, "widgets_order")
    hidden = await db.get(Setting, "widgets_hidden")
    return {
        "widgets_order": order.value if order else "leaderboard,urgent,rooms",
        "widgets_hidden": hidden.value if hidden else ""
    }

@router.patch("/widgets")
async def update_widgets(payload: WidgetsUpdate, db: AsyncSession = Depends(get_db)):
    order = await db.get(Setting, "widgets_order")
    if order: order.value = payload.widgets_order
    
    hidden = await db.get(Setting, "widgets_hidden")
    if hidden: hidden.value = payload.widgets_hidden
    
    await db.commit()
    return {"status": "success"}

@router.patch("/vacation")
async def toggle_vacation(payload: VacationToggle, db: AsyncSession = Depends(get_db)):
    mode_res = await db.get(Setting, "vacation_mode")
    start_res = await db.get(Setting, "vacation_started_at")
    
    is_currently_active = mode_res.value == "true"
    
    if payload.active and not is_currently_active:
        mode_res.value = "true"
        start_res.value = datetime.utcnow().isoformat()
    
    elif not payload.active and is_currently_active:
        start_dt = datetime.fromisoformat(start_res.value) if start_res.value else datetime.utcnow()
        delta = (datetime.utcnow() - start_dt).days
        if delta > 0:
            await apply_vacation_reset(db, delta)
        
        mode_res.value = "false"
        start_res.value = ""
        
    await db.commit()
    return {"vacation_mode": mode_res.value}