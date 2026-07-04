"""seed canonical task list

Revision ID: 009_seed_tasks
Revises: 008_eight_rooms
Create Date: 2026-07-01

"""
from alembic import op
import sqlalchemy as sa
from datetime import date, timedelta
import json

revision = '009_seed_tasks'
down_revision = '008_eight_rooms'
branch_labels = None
depends_on = None

# Room IDs post-migrazione 008
CUCINA = 1
BAGNO = 2
SOGGIORNO = 3
CAMERA = 4
BAGNETTO = 5
BALCONE = 6
CAMERETTA = 7
TERRAZZO = 8

TUTTE = [CUCINA, BAGNO, SOGGIORNO, CAMERA, BAGNETTO, BALCONE, CAMERETTA, TERRAZZO]


def skip_weekend(d: date) -> date:
    if d.weekday() == 5:
        return d + timedelta(days=2)
    if d.weekday() == 6:
        return d + timedelta(days=1)
    return d


def tags_for_rooms(room_ids: list) -> str:
    return json.dumps(['room:' + str(r) for r in room_ids])


# (name, frequency_days, primary_room_id, extra_room_ids, assignment_type, difficulty)
# assignment_type: FIXED_A=Utente A(id1), FIXED_B=Utente B(id2), ANY=chiunque
TASKS = [
    # Piante
    ('Piante dentro',               4,   SOGGIORNO,   [CAMERETTA],                           'FIXED_A', 1),
    ('Piante fuori',                2,   TERRAZZO,    [BALCONE],                              'FIXED_B', 1),
    # Spazzatura
    ('Buttare umido',               2,   CUCINA,      [],                                     'FIXED_B', 1),
    ('Buttare spazzatura',          7,   CUCINA,      [],                                     'FIXED_B', 1),
    # Pulizie generali
    ('Spolverare tutta casa',       7,   CUCINA,      [BAGNO,SOGGIORNO,CAMERA,BAGNETTO,BALCONE,CAMERETTA,TERRAZZO], 'ANY', 3),
    ('Tavoli (interno)',            7,   CUCINA,      [SOGGIORNO],                            'ANY', 1),
    ('Tavoli terrazzo',             14,  TERRAZZO,    [],                                     'ANY', 1),
    ('Sanitari',                    7,   BAGNO,       [BAGNETTO],                             'ANY', 2),
    ('Doccia completa',             14,  BAGNO,       [BAGNETTO],                             'ANY', 2),
    ('Cambiare lenzuola',           21,  CAMERA,      [CAMERETTA],                            'ANY', 3),
    ('Cambiare asciugamani',        14,  BAGNO,       [BAGNETTO],                             'ANY', 1),
    ('Accappatoi',                  60,  BAGNO,       [],                                     'FIXED_A', 1),
    # Ambrogio (robot aspirapolvere)
    ('Robot aspirapolvere — bagni',            2,   BAGNO,       [BAGNETTO],                             'ANY', 1),
    ('Robot aspirapolvere — casa',             7,   SOGGIORNO,   [CUCINA,CAMERA,CAMERETTA],              'ANY', 2),
    # Pavimenti e tappeti
    ('Aspirapolvere',               7,   SOGGIORNO,   [CUCINA,CAMERA,CAMERETTA],              'ANY', 2),
    ('Tappeti — aspira',            7,   SOGGIORNO,   [CAMERA,CAMERETTA],                    'ANY', 2),
    ('Tappeti — lava',              90,  SOGGIORNO,   [CAMERA,CAMERETTA],                    'ANY', 3),
    ('Lavare pavimenti',            30,  CUCINA,      [SOGGIORNO,CAMERA,BAGNETTO,CAMERETTA],  'FIXED_A', 3),
    # Varie pulizie
    ('Ragnatele',                   14,  CUCINA,      [BAGNO,SOGGIORNO,CAMERA,BAGNETTO,BALCONE,CAMERETTA,TERRAZZO], 'ANY', 2),
    ('Specchi',                     7,   BAGNO,       [BAGNETTO],                             'ANY', 1),
    ('Pulire cassetti cucina',      90,  CUCINA,      [],                                     'ANY', 2),
    # Terrazzo / balcone
    ('Pulire terrazzo (veloce)',    7,   TERRAZZO,    [BALCONE],                              'ANY', 2),
    ('Pulire terrazzo (profondo)',  30,  TERRAZZO,    [BALCONE],                              'ANY', 3),
    # Finestre
    ('Pulire vetri finestre',       90,  CUCINA,      [SOGGIORNO,CAMERA,CAMERETTA],           'ANY', 3),
    ('Persiane',                    180, CUCINA,      [SOGGIORNO,CAMERA,CAMERETTA],           'ANY', 3),
    ('Zanzariere',                  14,  CUCINA,      [SOGGIORNO,CAMERA,CAMERETTA],           'ANY', 2),
    # Elettrodomestici e manutenzione
    ('Pulizia lavatrice',           60,  CUCINA,      [],                                     'FIXED_B', 1),
    ('Manutenzione lavastoviglie',  14,  CUCINA,      [],                                     'FIXED_B', 2),
    ('Pulire lavastoviglie',        30,  CUCINA,      [],                                     'ANY', 2),
    ('Microonde',                   14,  CUCINA,      [],                                     'ANY', 2),
    ('Cappa',                       60,  CUCINA,      [],                                     'FIXED_B', 2),
    ('Caldaia',                     90,  CUCINA,      [],                                     'FIXED_B', 2),
    ('Macchinette caffè',           90,  CUCINA,      [],                                     'ANY', 2),
    ('Pulire lampadari',            180, SOGGIORNO,   [CUCINA,CAMERA,CAMERETTA],              'FIXED_B', 3),
]

QUICK_ACTIONS = [
    ('Fare lavatrice',           '👕'),
    ('Stendere',                 '🧺'),
    ('Svuotare lavastoviglie',   '🍽️'),
    ('Pulire cucina',            '🧹'),
]


def upgrade():
    bind = op.get_bind()

    # Disattiva tutti i task ricorrenti esistenti (non quick action)
    bind.execute(sa.text(
        "UPDATE tasks SET is_active=0, last_modified_reason='superseded_by_009' WHERE is_quick_action=0"
    ))

    # Disattiva quick action esistenti (verranno ricreate)
    bind.execute(sa.text(
        "UPDATE tasks SET is_active=0, last_modified_reason='superseded_by_009' WHERE is_quick_action=1"
    ))

    metadata = sa.MetaData()
    tasks_table = sa.Table(
        'tasks', metadata,
        sa.Column('name', sa.String()),
        sa.Column('room_id', sa.Integer()),
        sa.Column('frequency_days', sa.Integer()),
        sa.Column('grace_period_days', sa.Integer()),
        sa.Column('assignment_type', sa.String()),
        sa.Column('next_due_date', sa.Date()),
        sa.Column('difficulty', sa.Integer()),
        sa.Column('is_active', sa.Boolean()),
        sa.Column('is_quick_action', sa.Boolean()),
        sa.Column('tags', sa.Text()),
    )

    today = skip_weekend(date.today())

    rows = []
    for name, freq, primary_room, extra_rooms, assignment, diff in TASKS:
        all_rooms = [primary_room] + extra_rooms
        t = tags_for_rooms(all_rooms) if len(all_rooms) > 1 else None
        rows.append({
            'name': name,
            'room_id': primary_room,
            'frequency_days': freq,
            'grace_period_days': 1,
            'assignment_type': assignment,
            'next_due_date': skip_weekend(today),
            'difficulty': diff,
            'is_active': True,
            'is_quick_action': False,
            'tags': t,
        })

    for qa_name, _emoji in QUICK_ACTIONS:
        rows.append({
            'name': qa_name,
            'room_id': CUCINA,
            'frequency_days': 9999,
            'grace_period_days': 0,
            'assignment_type': 'ANY',
            'next_due_date': date(9999, 12, 31),
            'difficulty': 2,
            'is_active': True,
            'is_quick_action': True,
            'tags': None,
        })

    bind.execute(tasks_table.insert(), rows)


def downgrade():
    bind = op.get_bind()
    bind.execute(sa.text(
        "UPDATE tasks SET is_active=1 WHERE last_modified_reason='superseded_by_009'"
    ))
    bind.execute(sa.text("""
        DELETE FROM tasks WHERE last_modified_reason IS NULL AND is_active=1
        AND name IN (
            'Piante dentro','Piante fuori','Buttare umido','Buttare spazzatura',
            'Spolverare tutta casa','Tavoli (interno)','Tavoli terrazzo',
            'Sanitari','Doccia completa','Cambiare lenzuola','Cambiare asciugamani',
            'Accappatoi','Robot aspirapolvere — bagni','Robot aspirapolvere — casa',
            'Aspirapolvere','Tappeti — aspira','Tappeti — lava','Lavare pavimenti',
            'Ragnatele','Specchi','Pulire cassetti cucina',
            'Pulire terrazzo (veloce)','Pulire terrazzo (profondo)',
            'Pulire vetri finestre','Persiane','Zanzariere',
            'Pulizia lavatrice','Manutenzione lavastoviglie','Pulire lavastoviglie',
            'Microonde','Cappa','Caldaia','Macchinette caffè','Pulire lampadari',
            'Fare lavatrice','Stendere','Svuotare lavastoviglie','Pulire cucina'
        )
    """))
