from typing import Optional, List

def determine_next_performer(
    assignment_type: str, 
    last_performer_id: Optional[int], 
    active_user_ids: List[int],
    fixed_user_id: Optional[int] = None
) -> Optional[int]:
    if not active_user_ids:
        return None

    if assignment_type == "FIXED_A": 
        return active_user_ids[0] if len(active_user_ids) > 0 else None
    if assignment_type == "FIXED_B": 
        return active_user_ids[1] if len(active_user_ids) > 1 else (active_user_ids[0] if active_user_ids else None)
    if assignment_type == "FIXED_USER": 
        return fixed_user_id
    if assignment_type == "TOGETHER": 
        return None 

    if assignment_type == "ALTERNATING":
        if last_performer_id is None or last_performer_id not in active_user_ids:
            return active_user_ids[0]
        try:
            idx = active_user_ids.index(last_performer_id)
            next_idx = (idx + 1) % len(active_user_ids)
            return active_user_ids[next_idx]
        except ValueError:
            return active_user_ids[0]

    return None # Per ANY (chiunque)
