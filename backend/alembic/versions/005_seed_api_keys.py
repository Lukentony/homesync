"""seed api_keys table from N8N_API_KEY env var

Senza questo, /api/n8n/* è inutilizzabile perché verify_api_key cerca
key_hash nella tabella api_keys che la 001 ha creato vuota.

Idempotente: se la key è già presente non duplica.
"""
from alembic import op
import sqlalchemy as sa
import os
import hashlib

revision = "005_seed_api_keys"
down_revision = "004_align_with_frontend"
branch_labels = None
depends_on = None


def upgrade():
    raw_key = os.getenv("N8N_API_KEY", "").strip()
    if not raw_key:
        return

    low = raw_key.lower()
    if "cambia-mi" in low or low.startswith("replaceme_"):
        return

    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    op.execute(sa.text(
        "INSERT OR IGNORE INTO api_keys (key_hash, label) "
        "VALUES (:hash, :label)"
    ).bindparams(hash=key_hash, label="n8n (seeded from env)"))


def downgrade():
    raw_key = os.getenv("N8N_API_KEY", "").strip()
    if not raw_key:
        return
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    op.execute(sa.text("DELETE FROM api_keys WHERE key_hash=:h").bindparams(h=key_hash))
