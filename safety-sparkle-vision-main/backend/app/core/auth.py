from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import db_session_dep
from app.core.settings import get_settings
from app.models.user import User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_user_role(user: User) -> str:
    if getattr(user, "role", None):
        return str(user.role)
    return "admin" if user.is_admin else "viewer"


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(db_session_dep),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        token_type = payload.get("type")
        if token_type and token_type != "access":
            raise credentials_exc
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exc
        user_id = int(subject)
    except (JWTError, ValueError) as exc:
        raise credentials_exc from exc

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise credentials_exc
    return user


def require_roles(*allowed_roles: str):
    allowed = set(allowed_roles)

    async def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        role = get_user_role(current_user)
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role permissions",
            )
        return current_user

    return role_dependency
