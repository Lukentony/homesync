"""eight canonical rooms + cameretta

Revision ID: 008_eight_rooms
Revises: 007_quick_actions_and_seed_tasks
Create Date: 2026-07-01

"""
from alembic import op
import sqlalchemy as sa

revision = '008_eight_rooms'
down_revision = '007_quick_actions_and_seed_tasks'
branch_labels = None
depends_on = None

ROOMS = [
    (1, 'Cucina',     'Utensils:#E2743A', 1),
    (2, 'Bagno',      'Bath:#3B82AE',     2),
    (3, 'Soggiorno',  'Sofa:#6F9E7A',     3),
    (4, 'Camera',     'BedDouble:#8C5AC8',4),
    (5, 'Bagnetto',   'Bath:#D94B4B',     5),
    (6, 'Balcone',    'Flower2:#6B8E5A',  6),
    (7, 'Cameretta',  'BedDouble:#D96CAD',7),
    (8, 'Terrazzo',   'Flower2:#E0A93A',  8),
]

def upgrade():
    bind = op.get_bind()
    for room_id, name, icon, sort_order in ROOMS:
        bind.execute(
            sa.text(
                "UPDATE rooms SET name=:name, icon=:icon, sort_order=:sort_order, is_active=1 WHERE id=:id"
            ).bindparams(id=room_id, name=name, icon=icon, sort_order=sort_order)
        )
        bind.execute(
            sa.text(
                "INSERT OR IGNORE INTO rooms (id, name, icon, sort_order, is_active) VALUES (:id, :name, :icon, :sort_order, 1)"
            ).bindparams(id=room_id, name=name, icon=icon, sort_order=sort_order)
        )

def downgrade():
    bind = op.get_bind()
    bind.execute(sa.text("UPDATE rooms SET name='Studio', icon='Sofa', sort_order=7 WHERE id=7"))
