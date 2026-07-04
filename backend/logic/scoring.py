import math

def calculate_points(difficulty: int, assignment_type: str, num_users: int = 2, scoring_base: int = 10):
    base_points = difficulty * scoring_base

    if assignment_type == "TOGETHER":
        share = math.ceil(base_points / max(1, num_users))
        return share, True
    return base_points, False
