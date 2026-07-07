from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import ForeignKey, String, Integer, Boolean, DateTime, Date, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    onboarding_token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    total_points: Mapped[int] = mapped_column(default=0)
    emoji: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    push_subscription: Mapped[Optional[str]] = mapped_column(Text)
    # 200: allargata dalla migrazione 010 per gli hash scrypt (~104 char, vs
    # i 64 di SHA-256 legacy). Va tenuta allineata alla colonna reale.
    pin_hash: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    session_token: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    notification_morning_time: Mapped[str] = mapped_column(String(5), default="08:00")
    notification_evening_time: Mapped[str] = mapped_column(String(5), default="20:00")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

class Room(Base):
    __tablename__ = "rooms"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="Sofa")
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(default=True)
    tasks: Mapped[List["Task"]] = relationship(back_populates="room")

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    frequency_days: Mapped[int] = mapped_column(nullable=False)
    grace_period_days: Mapped[int] = mapped_column(default=0)
    assignment_type: Mapped[str] = mapped_column(String(20)) # FIXED_A, FIXED_B, ANY, ALTERNATING, TOGETHER
    fixed_user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    last_performer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    next_due_date: Mapped[date] = mapped_column(Date, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_quick_action: Mapped[bool] = mapped_column(default=False)
    tags: Mapped[Optional[str]] = mapped_column(Text) # JSON string array
    last_modified_reason: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    
    room: Mapped["Room"] = relationship(back_populates="tasks")
    __table_args__ = (CheckConstraint("difficulty >= 1 AND difficulty <= 5"),)

class Completion(Base):
    __tablename__ = "completions"
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id")) # NULL se automated
    completed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    was_on_demand: Mapped[bool] = mapped_column(default=False)
    was_automated: Mapped[bool] = mapped_column(default=False)
    used_theoretical_date: Mapped[bool] = mapped_column(default=False)
    # Colonna aggiunta dalla migrazione 011 ma mai mappata qui: complete_task
    # non poteva valorizzarla, quindi ogni completamento TOGETHER veniva
    # attribuito a un solo utente (chi aveva premuto sul proprio device) senza
    # alcuna traccia che fosse condiviso (bug scoperto e fixato il 2026-07-06).
    was_shared: Mapped[bool] = mapped_column(default=False)
    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True)
    points_awarded: Mapped[int] = mapped_column(default=0)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500))
    previous_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

class Setting(Base):
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[str] = mapped_column(Text)

class TaskOccurrenceOverride(Base):
    """Eccezione per una singola occorrenza di un task ricorrente (scope=this).
    La riga Task resta la regola di serie e non viene mai toccata da queste eccezioni."""
    __tablename__ = "task_occurrence_overrides"
    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"))
    occurrence_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # 'skipped' | 'modified'
    name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    room_id: Mapped[Optional[int]] = mapped_column(ForeignKey("rooms.id"), nullable=True)
    difficulty: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    __table_args__ = (
        CheckConstraint("status IN ('skipped', 'modified')"),
        UniqueConstraint("task_id", "occurrence_date"),
    )
