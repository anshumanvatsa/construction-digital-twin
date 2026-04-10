from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import db_session_dep
from app.schemas.auth import (
    AccessTokenResponse,
    LogoutResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    build_token_response,
    create_user,
    get_user_by_email,
    get_user_by_username,
    issue_refresh_token,
    purge_expired_refresh_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(db_session_dep)) -> TokenResponse:
    if await get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    if await get_user_by_username(db, payload.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already registered")

    user = await create_user(db, payload.username, payload.email, payload.password)
    await purge_expired_refresh_tokens(db)
    refresh_token = await issue_refresh_token(db, user.id)
    await db.commit()
    access_token = build_token_response(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(db_session_dep)) -> TokenResponse:
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    await purge_expired_refresh_tokens(db)
    refresh_token = await issue_refresh_token(db, user.id)
    await db.commit()
    access_token = build_token_response(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(db_session_dep),
) -> AccessTokenResponse:
    rotated = await rotate_refresh_token(db, payload.refresh_token)
    if not rotated:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user, next_refresh_token = rotated
    await db.commit()
    return AccessTokenResponse(
        access_token=build_token_response(user),
        refresh_token=next_refresh_token,
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(db_session_dep),
) -> LogoutResponse:
    await revoke_refresh_token(db, payload.refresh_token)
    await db.commit()
    return LogoutResponse(success=True, message="Logged out")
