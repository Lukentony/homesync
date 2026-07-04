"""add was_shared flag to completions

Revision ID: 011_add_was_shared
Revises: 010_add_user_emoji_color
Create Date: 2026-07-01

Nota: ricostruita 2026-07-02 (CL-003). Il file originale era andato perso ma
la colonna era già stata applicata al DB di produzione. Idempotente: aggiunge
la colonna solo se manca, così è sicura sia su un DB fresco sia su uno esistente.
"""
from alembic import op
import sqlalchemy as sa

revision = '011_add_was_shared'
down_revision = '010_add_user_emoji_color'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    cols = {row[1] for row in bind.execute(sa.text("PRAGMA table_info(completions)"))}
    if 'was_shared' not in cols:
        bind.execute(sa.text("ALTER TABLE completions ADD COLUMN was_shared BOOLEAN DEFAULT 0"))


def downgrade():
    with op.batch_alter_table('completions') as batch_op:
        batch_op.drop_column('was_shared')
