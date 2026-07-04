import json
from datetime import date, timedelta, datetime
from sqlalchemy import update
from models import Task

def calculate_next_date(base_date: date, frequency: int, type: str = "theoretical") -> date:
    target_date = base_date + timedelta(days=frequency)
    # Slittamento weekend (no scadenze Sabato e Domenica -> spostate al Lunedì)
    wd = target_date.weekday()
    if wd == 5:    # Sabato
        target_date += timedelta(days=2)
    elif wd == 6:  # Domenica → Martedì
        target_date += timedelta(days=2)
    return target_date


def parse_weekday_tags(tags):
    """Estrae i giorni fissi dai tag 'day:N'. N segue la convenzione JS
    (0=Dom, 1=Lun, ... 6=Sab). Ritorna un set di weekday Python (0=Lun..6=Dom)."""
    if not tags:
        return set()
    try:
        parsed = json.loads(tags) if isinstance(tags, str) else tags
    except Exception:
        return set()
    out = set()
    for t in (parsed or []):
        s = str(t)
        if s.startswith("day:"):
            try:
                js = int(s[4:])
            except ValueError:
                continue
            out.add((js + 6) % 7)  # JS (Dom=0) -> Python (Lun=0)
    return out


def next_due_from_recurrence(task, from_date: date) -> date:
    """Prossima scadenza secondo il tipo di ricorrenza DEL SINGOLO task:
    - se ha giorni fissi (tag day:) -> prossimo di quei giorni, strettamente dopo from_date;
    - altrimenti -> intervallo frequency_days (calculate_next_date).
    Unica fonte di verità: il backend. Il frontend non deve ricalcolarla."""
    weekdays = parse_weekday_tags(getattr(task, "tags", None))
    if weekdays:
        for i in range(1, 8):
            cand = from_date + timedelta(days=i)
            if cand.weekday() in weekdays:
                return cand
        return from_date + timedelta(days=7)  # fallback (non dovrebbe capitare)
    return calculate_next_date(from_date, task.frequency_days, "real")

async def apply_vacation_reset(session, days_passed: int):
    if days_passed > 0:
        stmt = (
            update(Task)
            .where(Task.is_active == True)
            .values(
                next_due_date=Task.next_due_date + timedelta(days=days_passed),
                last_modified_reason="vacation_reset"
            )
        )
        await session.execute(stmt)
