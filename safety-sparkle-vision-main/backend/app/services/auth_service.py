from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.core.settings import get_settings
from app.models.refresh_token import RefreshToken
from app.models.user import User

settings = get_settings()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == email))


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    return await db.scalar(select(User).where(User.username == username))


async def create_user(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
    is_admin: bool = False,
    role: str = "viewer",
) -> User:
    resolved_role = "admin" if is_admin else role
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
        is_admin=is_admin,
        role=resolved_role,
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def build_token_response(user: User) -> str:
    return create_access_token(
        str(user.id),
        {"email": user.email, "username": user.username, "role": user.role, "type": "access"},
    )


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def issue_refresh_token(db: AsyncSession, user_id: int) -> str:
    raw_token = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=_hash_refresh_token(raw_token),
            expires_at=expires_at,
            revoked_at=None,
        )
    )
    await db.flush()
    return raw_token


async def get_valid_refresh_token(db: AsyncSession, raw_token: str) -> RefreshToken | None:
    token_hash = _hash_refresh_token(raw_token)
    token_row = await db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if not token_row:
        return None

    now = datetime.now(timezone.utc)
    if token_row.revoked_at is not None or token_row.expires_at <= now:
        return None

    return token_row


async def revoke_refresh_token(db: AsyncSession, raw_token: str) -> bool:
    token_row = await get_valid_refresh_token(db, raw_token)
    if not token_row:
        return False

    token_row.revoked_at = datetime.now(timezone.utc)
    await db.flush()
    return True


async def rotate_refresh_token(db: AsyncSession, raw_token: str) -> tuple[User, str] | None:
    token_row = await get_valid_refresh_token(db, raw_token)
    if not token_row:
        return None

    user = await db.scalar(select(User).where(User.id == token_row.user_id))
    if not user or not user.is_active:
        return None

    token_row.revoked_at = datetime.now(timezone.utc)
    next_refresh_token = await issue_refresh_token(db, user.id)
    return user, next_refresh_token


async def purge_expired_refresh_tokens(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc)
    await db.execute(delete(RefreshToken).where(RefreshToken.expires_at < now))
