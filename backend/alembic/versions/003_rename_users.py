"""rename users to Lu Luca"""
from alembic import op
import sqlalchemy as sa

revision = '003_rename_users'
down_revision = '002_completion_previous_due'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("UPDATE users SET name='Lu' WHERE id=1")
    op.execute("UPDATE users SET name='Luca' WHERE id=2")

def downgrade():
    op.execute("UPDATE users SET name='User 1' WHERE id=1")
    op.execute("UPDATE users SET name='User 2' WHERE id=2")
