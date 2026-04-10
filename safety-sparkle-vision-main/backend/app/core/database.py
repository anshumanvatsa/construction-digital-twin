from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.settings import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.sqlalchemy_database_uri,
    echo=False,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def assert_migrations_ready() -> None:
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT to_regclass('public.alembic_version')"))
        version_table = result.scalar_one_or_none()

    if not version_table:
        raise RuntimeError(
            "Database migrations are not initialized. "
            "Run Alembic migrations or enable AUTO_CREATE_TABLES."
        )
