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

            # Le penalità notturne sono state rimosse: il ritardo riduce il
            # valore base del task a 1 al momento del completamento
            # (vedi routers/tasks.py:complete_task).

        except asyncio.CancelledError:
            logger.info("Notification scheduler stopped")
            break
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
            await asyncio.sleep(10)

async def check_and_send_notifications(time_str: str):
    async with async_session() as session:
        vacation_res = await session.execute(select(Setting).where(Setting.key == "vacation_mode"))
        vacation = vacation_res.scalar_one_or_none()
        if vacation and vacation.value == "true":
            return
            
        res_priv = await session.execute(select(Setting.value).where(Setting.key == "vapid_private_key"))
        private_key = res_priv.scalar()
        res_email = await session.execute(select(Setting.value).where(Setting.key == "vapid_claims_email"))
        email = res_email.scalar() or "admin@homesync.local"
        
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
