"""initial migration"""
from alembic import op
import sqlalchemy as sa
import os
from datetime import date

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Creazione tabelle
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('onboarding_token', sa.String(100), unique=True, nullable=False),
        sa.Column('total_points', sa.Integer(), default=0),
        sa.Column('push_subscription', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_table('rooms',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(50), default='Sofa'),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('is_active', sa.Boolean(), default=True)
    )
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.id'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('frequency_days', sa.Integer(), nullable=False),
        sa.Column('grace_period_days', sa.Integer(), default=0),
        sa.Column('assignment_type', sa.String(20), nullable=False),
        sa.Column('fixed_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('last_performer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('difficulty', sa.Integer(), default=3),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('last_modified_reason', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_table('completions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('task_id', sa.Integer(), sa.ForeignKey('tasks.id'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('completed_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('was_on_demand', sa.Boolean(), default=False),
        sa.Column('was_automated', sa.Boolean(), default=False),
        sa.Column('used_theoretical_date', sa.Boolean(), default=False),
        sa.Column('idempotency_key', sa.String(100), unique=True, nullable=False),
        sa.Column('points_awarded', sa.Integer(), default=0),
        sa.Column('photo_url', sa.String(500), nullable=True)
    )
    op.create_table('settings',
        sa.Column('key', sa.String(50), primary_key=True),
        sa.Column('value', sa.Text(), nullable=False)
    )
    op.create_table('api_keys',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('key_hash', sa.String(64), unique=True, nullable=False),
        sa.Column('label', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )

    # Seed Settings
    op.execute("INSERT INTO settings (key, value) VALUES ('vacation_mode', 'false')")
    op.execute("INSERT INTO settings (key, value) VALUES ('vacation_started_at', '')")
    op.execute("INSERT INTO settings (key, value) VALUES ('app_initialized', 'true')")
    op.execute("INSERT INTO settings (key, value) VALUES ('webhook_url', '')")
    op.execute("INSERT INTO settings (key, value) VALUES ('webhook_enabled', 'false')")

    # Seed Users
    user_a_name = os.getenv("USER_A_NAME", "UserA")
    user_a_token = os.getenv("USER_A_TOKEN", "token-a")
    user_b_name = os.getenv("USER_B_NAME", "UserB")
    user_b_token = os.getenv("USER_B_TOKEN", "token-b")
    op.execute(
        sa.text("INSERT OR IGNORE INTO users (id, name, onboarding_token, total_points) VALUES (:id, :name, :token, 0)").bindparams(id=1, name=user_a_name, token=user_a_token)
    )
    op.execute(
        sa.text("INSERT OR IGNORE INTO users (id, name, onboarding_token, total_points) VALUES (:id, :name, :token, 0)").bindparams(id=2, name=user_b_name, token=user_b_token)
    )

    # Seed Stanze
    op.execute("INSERT INTO rooms (id, name, icon, sort_order, is_active) VALUES (1, 'Cucina', 'ChefHat', 1, 1)")
    op.execute("INSERT INTO rooms (id, name, icon, sort_order, is_active) VALUES (2, 'Bagno', 'Bath', 2, 1)")
    op.execute("INSERT INTO rooms (id, name, icon, sort_order, is_active) VALUES (3, 'Soggiorno', 'Sofa', 3, 1)")

    # Seed Task
    today = date.today()
    tasks_data = [
        (1, 'Lavare i piatti', 1, 2, 'ANY'),
        (1, 'Pulire i fornelli', 7, 3, 'ALTERNATING'),
        (2, 'Pulire il bagno', 7, 4, 'ALTERNATING'),
        (3, 'Aspirare', 7, 3, 'ANY'),
        (3, 'Spolverare', 14, 2, 'ALTERNATING')
    ]
    for r_id, name, freq, diff, a_type in tasks_data:
        op.execute(
            sa.text("INSERT INTO tasks (room_id, name, frequency_days, next_due_date, difficulty, assignment_type, last_modified_reason, is_active) VALUES (:room_id, :name, :freq, :today, :diff, :a_type, 'created', 1)").bindparams(room_id=r_id, name=name, freq=freq, today=today, diff=diff, a_type=a_type)
        )

def downgrade():
    op.drop_table('api_keys')
    op.drop_table('settings')
    op.drop_table('completions')
    op.drop_table('tasks')
    op.drop_table('rooms')
    op.drop_table('users')
