"""add previous_due_date to completions"""
from alembic import op
import sqlalchemy as sa

revision = '002_completion_previous_due'
down_revision = '001_initial'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('completions', sa.Column('previous_due_date', sa.Date(), nullable=True))

def downgrade():
    op.drop_column('completions', 'previous_due_date')
