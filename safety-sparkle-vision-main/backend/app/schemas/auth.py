from pydantic import ConfigDict, Field, field_validator

from app.schemas.common import AppBaseModel


class UserRegister(AppBaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not value.replace("_", "").replace("-", "").isalnum():
            raise ValueError("username can only contain letters, numbers, underscores, and hyphens")
        return value


class UserLogin(AppBaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserResponse(AppBaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    role: str
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(AppBaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(AppBaseModel):
    refresh_token: str = Field(min_length=16, max_length=1024)


class AccessTokenResponse(AppBaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutResponse(AppBaseModel):
    success: bool
    message: str