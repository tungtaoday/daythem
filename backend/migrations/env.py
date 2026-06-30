"""Alembic environment for DayThem.

The database URL is sourced from ``daythem.config.settings.DATABASE_URL`` (NOT
from ``alembic.ini``), so the same migrations run against sqlite in dev/tests
and PostgreSQL in production. Importing ``daythem.adapters.orm`` pulls in every
ORM model, ensuring ``Base.metadata`` knows all tables for autogenerate.
"""
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Importing orm registers every model on Base.metadata.
from daythem.adapters.orm import Base
from daythem.config import settings

# Alembic Config object — access to values in alembic.ini.
config = context.config

# Inject the runtime DB URL (overrides any sqlalchemy.url in alembic.ini).
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for 'autogenerate' support.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL, no live DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=url.startswith("sqlite"),
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (against a live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # batch mode lets sqlite handle ALTER TABLE in future migrations.
            render_as_batch=connection.dialect.name == "sqlite",
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
