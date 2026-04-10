from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session


async def db_session_dep(session: AsyncSession = Depends(get_db_session)) -> AsyncSession:
    return session
