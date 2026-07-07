"""rename users (no-op placeholder)

Storicamente questa migrazione rinominava gli utenti a valori fissi,
sovrascrivendo qualsiasi nome configurato via USER_A_NAME/USER_B_NAME
dalla migrazione 001 su ogni installazione da zero. Reso no-op: i nomi
restano quelli scelti dall'amministratore in .env.
"""
from alembic import op
import sqlalchemy as sa

revision = '003_rename_users'
down_revision = '002_completion_previous_due'
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass
