from logging.config import fileConfig
import os
from sqlalchemy import pool, create_engine
from alembic import context

from database import Base
from models import * # Importa tutti i modelli per autogenerate

config = context.config
# Skip logging config - not needed for migrations
# if config.config_file_name is not None:
#     fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = f"sqlite:///{os.getenv('DATABASE_PATH', '/data/homesync.db')}"
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "qmark"})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    db_path = os.getenv('DATABASE_PATH', '/data/homesync.db')
    url = f"sqlite:///{db_path}"

    connectable = create_engine(url, poolclass=pool.StaticPool, connect_args={"check_same_thread": False})

    with connectable.begin() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()