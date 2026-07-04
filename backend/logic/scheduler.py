import asyncio
import logging
import json
from datetime import datetime, date, timedelta
from sqlalchemy import select, and_
from database import async_session
from models import User, Task, Setting
from logic.push import send_web_push

logger = logging.getLogger("homesync")

async def notification_scheduler_loop():
    """Background task running every minute to send scheduled push notifications and apply daily penalties."""
    logger.info("Notification scheduler started")
    while True:
        try:
            # Calcola quanti secondi mancano allo scoccare del minuto successivo per precisione
            now = datetime.now()
            sleep_time = 60 - now.second
            await asyncio.sleep(sleep_time)
            
            dt_now = datetime.now()
            current_time = dt_now.strftime("%H:%M")
            
            # Esegue il check delle notifiche push
            await check_and_send_notifications(current_time)
            
            # Alle 00:01 applica le penalità sui compiti scaduti
            if current_time == "00:01":
                async with async_session() as session:
                    await apply_overdue_penalties(session)
                    await session.commit()
                    
        except asyncio.CancelledError:
            logger.info("Notification scheduler stopped")
            break
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
            await asyncio.sleep(10)

async def apply_overdue_penalties(session):
    logger.info("Applying daily overdue penalties")

    today = date.today()
    # Nessuna penalità nel weekend
    if today.weekday() >= 5:
        logger.info("Skipping penalties: weekend")
        return

    scoring_base_res = await session.execute(
        select(Setting).where(Setting.key == "scoring_base")
    )
    scoring_base_setting = scoring_base_res.scalar_one_or_none()
    scoring_base = int(scoring_base_setting.value) if scoring_base_setting else 10

    tasks_res = await session.execute(
        select(Task).where(and_(Task.is_active == True, Task.is_quick_action == False))
    )
    tasks = tasks_res.scalars().all()

    users_res = await session.execute(select(User).order_by(User.id.asc()))
    users = users_res.scalars().all()
    users_dict = {u.id: u for u in users}
    active_ids = list(users_dict.keys())

    from logic.assignment import determine_next_performer

    for t in tasks:
        if t.next_due_date < today:
            delay_days = (today - t.next_due_date).days
            if delay_days not in (1, 3):
                continue

            assigned_id = determine_next_performer(t.assignment_type, t.last_performer_id, active_ids, t.fixed_user_id)

            assigned_users = []
            if t.assignment_type == "TOGETHER":
                assigned_users = users
            elif t.assignment_type in ["FIXED_A", "FIXED_B", "ALTERNATING"]:
                if assigned_id in users_dict:
                    assigned_users = [users_dict[assigned_id]]

            if not assigned_users:
                continue

            penalty = 1 if delay_days == 1 else t.difficulty * scoring_base

            for u in assigned_users:
                u.total_points = max(0, (u.total_points or 0) - penalty)
                logger.info(f"Subtracted {penalty} pts from {u.name} for '{t.name}' (delay: {delay_days}d)")

async def check_and_send_notifications(time_str: str):
    async with async_session() as session:
        vacation_res = await session.execute(select(Setting).where(Setting.key == "vacation_mode"))
        vacation = vacation_res.scalar_one_or_none()
        if vacation and vacation.value == "true":
            return
            
        res_priv = await session.execute(select(Setting.value).where(Setting.key == "vapid_private_key"))
        private_key = res_priv.scalar()
        res_email = await session.execute(select(Setting.value).where(Setting.key == "vapid_claims_email"))
        email = res_email.scalar() or "luca@homesync.local"
        
        if not private_key:
            return
            
        users_res = await session.execute(
            select(User).where(
                and_(
                    User.push_subscription != None,
                    User.push_subscription != "",
                    (User.notification_morning_time == time_str) | (User.notification_evening_time == time_str)
                )
            )
        )
        users = users_res.scalars().all()
        if not users:
            return
            
        tomorrow = date.today() + timedelta(days=1)
        for user in users:
            tasks_res = await session.execute(
                select(Task).where(
                    and_(
                        Task.is_active == True,
                        Task.is_quick_action == False,
                        Task.next_due_date <= tomorrow
                    )
                )
            )
            all_due_tasks = tasks_res.scalars().all()
            
            users_all_res = await session.execute(select(User.id).order_by(User.id.asc()))
            active_ids = [uid for uid in users_all_res.scalars().all()]
            
            from logic.assignment import determine_next_performer
            user_due_tasks = []
            for t in all_due_tasks:
                assigned_id = determine_next_performer(t.assignment_type, t.last_performer_id, active_ids, t.fixed_user_id)
                if assigned_id == user.id or t.assignment_type in ["ANY", "TOGETHER"]:
                    user_due_tasks.append(t.name)
            
            if user_due_tasks:
                try:
                    sub_info = json.loads(user.push_subscription)
                    payload = {
                        "title": "HomeSync: compiti da fare!",
                        "body": f"Hai {len(user_due_tasks)} compiti scaduti o in scadenza: {', '.join(user_due_tasks[:3])}...",
                        "badge": "/favicon.png",
                        "icon": "/icon.svg"
                    }
                    success = send_web_push(sub_info, payload, private_key, email)
                    if not success:
                        user.push_subscription = None
                except Exception as ex:
                    logger.error(f"Error parsing subscription or sending push for user {user.id}: {ex}")
        
        await session.commit()
