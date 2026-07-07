import os
import time

def generate_key(task_id: int, user_id: int, assignment_type: str) -> str:
    window = int(os.getenv("IDEMPOTENCY_WINDOW_SECONDS", 60))
    # Arrotondamento intero del timestamp corrente sulla finestra temporale
    time_slot = int(time.time()) // window
    
    if assignment_type == "TOGETHER":
        return f"together-{task_id}-{time_slot}"
    
    return f"task-{task_id}-user-{user_id}-{time_slot}"
