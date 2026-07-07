from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, List


class TaskBase(BaseModel):
    """Base schema for Task creation/updates"""
    name: str
    room_id: int
    frequency_days: int
    grace_period_days: Optional[int] = 0
    assignment_type: str
    fixed_user_id: Optional[int] = None
    difficulty: int = 3
    tags: Optional[str] = None
    next_due_date: Optional[date] = None
    scoring_base: Optional[int] = None
    is_quick_action: Optional[bool] = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Il nome del task non può essere vuoto")
        return v.strip()

    @field_validator("frequency_days")
    @classmethod
    def frequency_positive(cls, v):
        if v < 1:
            raise ValueError("frequency_days deve essere >= 1")
        return v


class TaskRead(TaskBase):
    """Schema for reading Task data"""
    id: int
    next_due_date: date
    last_performer_id: Optional[int] = None
    is_active: bool
    last_modified_reason: Optional[str] = None
    created_at: datetime
    # Campi per ricorrenza espansa (popolati da expand_recurring)
    instance_date: Optional[date] = None
    instance_type: Optional[str] = None  # "original" | "expanded"
    assigned_user_id: Optional[int] = None
    # Scope "solo questa occorrenza" (PIANO_HOMESYNC_EDIT_SCOPE, Fase 2)
    has_history: bool = False
    has_occurrence_override: bool = False
    skipped_occurrences: List[date] = []

    class Config:
        from_attributes = True


class CompletionCreate(BaseModel):
    """Schema for creating a Completion record"""
    use_theoretical_date: bool = False
    user_id: Optional[int] = None
    was_on_demand: bool = False
    was_automated: bool = False
    used_theoretical_date: bool = False
    points_awarded: int = 0
    photo_url: Optional[str] = None
    instance_date: Optional[date] = None  # per completamento istanza espansa


class RoomBase(BaseModel):
    """Base schema for Room creation/updates"""
    name: str
    icon: str = "Sofa"
    sort_order: int = 0

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Il nome della stanza non può essere vuoto")
        return v.strip()


class RoomRead(RoomBase):
    """Schema for reading Room data"""
    id: int
    is_active: bool
    completion_percentage: Optional[float] = None

    class Config:
        from_attributes = True


class VacationToggle(BaseModel):
    """Schema for vacation mode toggle request"""
    active: bool


class TaskCreate(TaskBase):
    """Schema for creating a new task with optional initial due date"""
    initial_due_date: Optional[date] = None


class LeaderboardEntry(BaseModel):
    """Schema for leaderboard entry"""
    user_id: int
    user_name: str
    emoji: Optional[str] = ""
    color: Optional[str] = ""
    weekly_points: int
    total_points: int


class StatsResponse(BaseModel):
    """Schema for statistics response"""
    leaderboard: List[LeaderboardEntry]


class PreferencesUpdate(BaseModel):
    show_urgency_colors: str
    early_completion_days: str
    grace_period_days: str


class WidgetsUpdate(BaseModel):
    widgets_order: str
    widgets_hidden: str


class UserRename(BaseModel):
    name: str


class UserPatch(BaseModel):
    name: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    pin: Optional[str] = None
    notification_morning_time: Optional[str] = None
    notification_evening_time: Optional[str] = None
    push_subscription: Optional[str] = None


class ScoringSettings(BaseModel):
    base: int = 3
    overdue_bonus: int = 1
    streak_bonus: int = 5
    split_shared: bool = True
    weekly_reset: bool = True


class UserLogin(BaseModel):
    user_id: int
    pin: str


class LoginResponse(BaseModel):
    status: str
    session_token: str
    user_id: int
    user_name: str


class UserCreate(BaseModel):
    name: str
    emoji: Optional[str] = "🦦"
    color: Optional[str] = "#E2743A"
    pin: Optional[str] = None
