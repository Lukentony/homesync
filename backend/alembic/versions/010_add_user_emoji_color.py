"""add emoji and color to users, widen pin_hash for scrypt

Revision ID: 010_add_user_emoji_color
Revises: 009_seed_tasks
Create Date: 2026-07-01
"""
from alembic import op
import sqlalchemy as sa

revision = '010_add_user_emoji_color'
down_revision = '009_seed_tasks'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # SQLite ignora i vincoli di lunghezza, ma ADD COLUMN può fallire
    # se la colonna esiste già — usiamo un check prima di aggiungere.
    cols = {row[1] for row in bind.execute(sa.text("PRAGMA table_info(users)"))}

    if 'emoji' not in cols:
        bind.execute(sa.text("ALTER TABLE users ADD COLUMN emoji VARCHAR(10)"))
        # Default emoji per i due utenti già esistenti
        bind.execute(sa.text("UPDATE users SET emoji='🦦' WHERE id=1"))
        bind.execute(sa.text("UPDATE users SET emoji='🐻' WHERE id=2"))

    if 'color' not in cols:
        bind.execute(sa.text("ALTER TABLE users ADD COLUMN color VARCHAR(10)"))
        bind.execute(sa.text("UPDATE users SET color='#E2743A' WHERE id=1"))
        bind.execute(sa.text("UPDATE users SET color='#6F9E7A' WHERE id=2"))

    # pin_hash: VARCHAR(64) era per SHA-256; scrypt produce ~104 char.
    # SQLite non impone la lunghezza, ma aggiorniamo il tipo per chiarezza
    # tramite batch_alter (recreate della tabella).
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('pin_hash', type_=sa.String(200))


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('color')
        batch_op.drop_column('emoji')
        batch_op.alter_column('pin_hash', type_=sa.String(64))
