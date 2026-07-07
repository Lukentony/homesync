"""align seed data with frontend prototype (revision 2)

Allinea SOLO le stanze al prototipo (7 stanze) e inserisce i task di
esempio. I nomi utente restano quelli configurati via .env (001) — gli
utenti possono comunque rinominarsi a runtime via API.

Idempotente: usa INSERT OR IGNORE / UPDATE mirate per non sovrascrivere
modifiche fatte a runtime.
"""
from alembic import op
import sqlalchemy as sa
from datetime import date, timedelta

revision = "004_align_with_frontend"
down_revision = "003_rename_users"
branch_labels = None
depends_on = None


def upgrade():
    today = date.today()

    # --- 7 STANZE (idempotente) ---------------------------------------------
    # Le 6 del prototipo + Studio come settima. L'utente può poi
    # rinominare/disattivare/aggiungere via UI.
    rooms = [
        # (id,  name,         icon,             sort_order)
        (1, "Cucina",     "Utensils",       1),
        (2, "Bagno",      "Bath",           2),
        (3, "Soggiorno",  "Sofa",           3),
        (4, "Camera",     "BedDouble",      4),
        (5, "Lavanderia", "WashingMachine", 5),
        (6, "Balcone",    "Flower2",        6),
        (7, "Studio",     "BookOpen",       7),
    ]
    for r_id, name, icon, sort_order in rooms:
        op.execute(sa.text(
            "INSERT OR IGNORE INTO rooms (id, name, icon, sort_order, is_active) "
            "VALUES (:id, :name, :icon, :sort, 1)"
        ).bindparams(id=r_id, name=name, icon=icon, sort=sort_order))

    # Riallinea icone delle 3 stanze nate dalla 001 con icone diverse
    icon_realign = [
        (1, "ChefHat", "Utensils"),
        (2, "Bath",    "Bath"),
        (3, "Sofa",    "Sofa"),
    ]
    for r_id, old_icon, new_icon in icon_realign:
        op.execute(sa.text(
            "UPDATE rooms SET icon=:new WHERE id=:id AND icon=:old"
        ).bindparams(id=r_id, new=new_icon, old=old_icon))

    # --- TASK seed allineati al prototipo (idempotenti per nome) ------------
    # (room_id, name, frequency, difficulty, assignment_type, due_offset_days)
    proto_tasks = [
        # Today / overdue
        (1, "Lavare i piatti",         1,  2, "ANY",         0),
        (4, "Cambiare le lenzuola",    14, 5, "ALTERNATING", 0),
        (1, "Svuotare l'umido",        2,  3, "ALTERNATING", -1),
        (2, "Pulire il bagno",         7,  4, "ALTERNATING", 1),
        # Soon
        (3, "Aspirare il soggiorno",   5,  3, "ANY",         2),
        (6, "Innaffiare le piante",    3,  2, "ANY",         3),
        # OK
        (1, "Cambiare la spugna",      14, 1, "ANY",         5),
        (5, "Lavatrice colorati",      7,  3, "ALTERNATING", 4),
        (2, "Pulire specchi",          10, 2, "ANY",         6),
        # Shared
        (1, "Fare la spesa",           3,  4, "TOGETHER",    0),
        (1, "Portare giù i rifiuti",   2,  2, "TOGETHER",    1),
    ]

    for room_id, name, freq, diff, atype, offset in proto_tasks:
        op.execute(sa.text("""
            INSERT INTO tasks
                (room_id, name, frequency_days, grace_period_days,
                 next_due_date, difficulty, assignment_type,
                 last_modified_reason, is_active)
            SELECT :room_id, :name, :freq, 0,
                   :due, :diff, :atype,
                   'seed_004', 1
            WHERE NOT EXISTS (
                SELECT 1 FROM tasks WHERE name = :name AND is_active = 1
            )
        """).bindparams(
            room_id=room_id,
            name=name,
            freq=freq,
            due=today + timedelta(days=offset),
            diff=diff,
            atype=atype,
        ))


def downgrade():
    # No-op per sicurezza: non vogliamo cancellare task usati a runtime.
    pass
