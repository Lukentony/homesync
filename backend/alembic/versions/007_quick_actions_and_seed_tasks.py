"""quick actions and seed tasks

Revision ID: 007_quick_actions_and_seed_tasks
Revises: 006_user_auth_and_notifications
Create Date: 2026-06-29 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import date

# revision identifiers, used by Alembic.
revision = '007_quick_actions_and_seed_tasks'
down_revision = '006_user_auth_and_notifications'
branch_labels = None
depends_on = None

def upgrade():
    # Aggiunge colonna is_quick_action a tasks
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_quick_action', sa.Boolean(), server_default='0', nullable=False))

    # Inserisce compiti seed
    bind = op.get_bind()
    metadata = sa.MetaData()
    tasks_table = sa.Table(
        'tasks', metadata,
        sa.Column('room_id', sa.Integer()),
        sa.Column('name', sa.String()),
        sa.Column('frequency_days', sa.Integer()),
        sa.Column('grace_period_days', sa.Integer()),
        sa.Column('assignment_type', sa.String()),
        sa.Column('next_due_date', sa.Date()),
        sa.Column('difficulty', sa.Integer()),
        sa.Column('is_active', sa.Boolean()),
        sa.Column('is_quick_action', sa.Boolean()),
    )

    # Nuovi compiti a lungo termine
    today = date.today()
    bind.execute(tasks_table.insert().values([
        # seed recurrent tasks (room_id=1 Cucina, room_id=3 Salotto)
        {"room_id": 1, "name": "Pulire macchinette caffè + trattamento", "frequency_days": 90, "grace_period_days": 3, "assignment_type": "ALTERNATING", "next_due_date": today, "difficulty": 3, "is_active": True, "is_quick_action": False},
        {"room_id": 1, "name": "Pulire lavastoviglie", "frequency_days": 30, "grace_period_days": 2, "assignment_type": "ALTERNATING", "next_due_date": today, "difficulty": 3, "is_active": True, "is_quick_action": False},
        {"room_id": 3, "name": "Aspirare tappeti", "frequency_days": 7, "grace_period_days": 1, "assignment_type": "ANY", "next_due_date": today, "difficulty": 2, "is_active": True, "is_quick_action": False},
        {"room_id": 3, "name": "Lavare tappeti", "frequency_days": 90, "grace_period_days": 5, "assignment_type": "ALTERNATING", "next_due_date": today, "difficulty": 4, "is_active": True, "is_quick_action": False},
        {"room_id": 3, "name": "Lavare pavimenti", "frequency_days": 30, "grace_period_days": 3, "assignment_type": "ALTERNATING", "next_due_date": today, "difficulty": 4, "is_active": True, "is_quick_action": False},
        {"room_id": 3, "name": "Pulire lampadari", "frequency_days": 180, "grace_period_days": 7, "assignment_type": "ALTERNATING", "next_due_date": today, "difficulty": 4, "is_active": True, "is_quick_action": False},

        # seed quick actions (room_id=1 Cucina)
        # assignment_type=TOGETHER: come per create_task/update_task, i task
        # rapidi sono sempre condivisibili (picker "Chi l'ha fatto?" con
        # opzione "Insieme" che splitta i punti). Con "ANY" (bug storico di
        # questa migrazione) is_shared risultava sempre False in complete_task,
        # quindi scegliere "Insieme" assegnava tutti i punti a chi aveva
        # effettuato il login, invece di splittarli.
        {"room_id": 1, "name": "Fare lavatrice", "frequency_days": 9999, "grace_period_days": 0, "assignment_type": "TOGETHER", "next_due_date": date(9999, 12, 31), "difficulty": 2, "is_active": True, "is_quick_action": True},
        {"room_id": 1, "name": "Stendere", "frequency_days": 9999, "grace_period_days": 0, "assignment_type": "TOGETHER", "next_due_date": date(9999, 12, 31), "difficulty": 2, "is_active": True, "is_quick_action": True},
        {"room_id": 1, "name": "Svuotare lavastoviglie", "frequency_days": 9999, "grace_period_days": 0, "assignment_type": "TOGETHER", "next_due_date": date(9999, 12, 31), "difficulty": 2, "is_active": True, "is_quick_action": True},
        {"room_id": 1, "name": "Pulire cucina (piano+lavandino+cottura)", "frequency_days": 9999, "grace_period_days": 0, "assignment_type": "TOGETHER", "next_due_date": date(9999, 12, 31), "difficulty": 3, "is_active": True, "is_quick_action": True},
    ]))

def downgrade():
    bind = op.get_bind()
    bind.execute(sa.text("""DELETE FROM tasks WHERE name IN (
        'Pulire macchinette caffè + trattamento',
        'Pulire lavastoviglie',
        'Aspirare tappeti',
        'Lavare tappeti',
        'Lavare pavimenti',
        'Pulire lampadari',
        'Fare lavatrice',
        'Stendere',
        'Svuotare lavastoviglie',
        'Pulire cucina (piano+lavandino+cottura)'
    )"""))

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_column('is_quick_action')
