"""add task_occurrence_overrides table

Revision ID: 012_task_occurrence_overrides
Revises: 011_add_was_shared
Create Date: 2026-07-06

Tabella per le eccezioni "solo questa occorrenza" su task ricorrenti
(PIANO_HOMESYNC_EDIT_SCOPE, Fase 2). Nessun impatto sui dati esistenti,
tabella vuota all'avvio.
"""
from alembic import op
import sqlalchemy as sa

revision = '012_task_occurrence_overrides'
down_revision = '011_add_was_shared'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    tables = {row[0] for row in bind.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ))}
    if 'task_occurrence_overrides' not in tables:
        op.create_table(
            'task_occurrence_overrides',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('task_id', sa.Integer(), sa.ForeignKey('tasks.id'), nullable=False),
            sa.Column('occurrence_date', sa.Date(), nullable=False),
            sa.Column('status', sa.String(20), nullable=False),
            sa.Column('name', sa.String(200), nullable=True),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.id'), nullable=True),
            sa.Column('difficulty', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.CheckConstraint("status IN ('skipped', 'modified')"),
            sa.UniqueConstraint('task_id', 'occurrence_date'),
        )


def downgrade():
    op.drop_table('task_occurrence_overrides')
