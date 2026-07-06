"""rename users to Utente A Utente B"""
from alembic import op
import sqlalchemy as sa

revision = '003_rename_users'
down_revision = '002_completion_previous_due'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("UPDATE users SET name='Utente A' WHERE id=1")
    op.execute("UPDATE users SET name='Utente B' WHERE id=2")

def downgrade():
    op.execute("UPDATE users SET name='User 1' WHERE id=1")
    op.execute("UPDATE users SET name='User 2' WHERE id=2")
