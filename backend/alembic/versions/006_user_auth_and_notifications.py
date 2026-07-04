"""add user auth and notifications and drop api_keys

Revision ID: 006_user_auth_and_notifications
Revises: 005_seed_api_keys
Create Date: 2026-06-29 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006_user_auth_and_notifications'
down_revision = '005_seed_api_keys'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('pin_hash', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('session_token', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('notification_morning_time', sa.String(length=5), server_default='08:00', nullable=False))
        batch_op.add_column(sa.Column('notification_evening_time', sa.String(length=5), server_default='20:00', nullable=False))
        batch_op.create_unique_constraint('uq_users_session_token', ['session_token'])

    # Rimuove la tabella api_keys
    op.drop_table('api_keys')

def downgrade():
    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('key_hash', sa.String(length=64), unique=True, nullable=False),
        sa.Column('label', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('uq_users_session_token', type_='unique')
        batch_op.drop_column('notification_evening_time')
        batch_op.drop_column('notification_morning_time')
        batch_op.drop_column('session_token')
        batch_op.drop_column('pin_hash')
