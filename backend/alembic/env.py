import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Load our app settings so we get DATABASE_URL
from app.core.config import settings

# Import all models so Alembic can detect schema changes
from app.db import base  # noqa — triggers all model imports

from app.db.base_class import Base

# Alembic Config object
alembic_config = context.config

# Wire up Python logging from alembic.ini
if alembic_config.config_file_name is not None:
    fileConfig(alembic_config.config_file_name)

# Point Alembic at our models' metadata for autogenerate
target_metadata = Base.metadata

# Override the sqlalchemy.url from our env settings
alembic_config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations without a live database connection (generates SQL)."""
    url = alembic_config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database connection."""
    connectable = engine_from_config(
        alembic_config.get_section(alembic_config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
