"""Router de autenticación — login, logout, me."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Response, Request

from backend.auth.models import LoginRequest, UserResponse
from backend.auth.security import create_access_token, verify_password
from backend.auth import repository
from backend.auth.dependencies import get_current_user
from backend.auth.models import User
from backend.schemas import APIResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Detectar entorno para cookie Secure
_IS_PRODUCTION = os.environ.get("SECRET_KEY", "") != ""


@router.post("/login")
def login(body: LoginRequest, response: Response, request: Request) -> APIResponse:
    """Inicia sesión y setea cookie JWT."""
    user = repository.find_by_username(body.username)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    token = create_access_token(
        data={
            "sub": user.user_id,
            "username": user.username,
            "role": user.role,
        }
    )

    # Determinar si el host es local para evitar forzar Secure/SameSite=None sin HTTPS
    host = request.headers.get("host", "").lower()
    is_local = "localhost" in host or "127.0.0.1" in host
    
    secure_cookie = _IS_PRODUCTION and not is_local
    samesite_cookie = "none" if secure_cookie else "lax"

    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=secure_cookie,
        samesite=samesite_cookie,
        path="/api",
        max_age=60 * 60 * 8,  # 8 horas
    )

    return APIResponse(
        message=f"Bienvenido, {user.display_name}.",
        data=UserResponse(
            user_id=user.user_id,
            username=user.username,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        ).model_dump(),
    )


@router.post("/logout")
def logout(response: Response, request: Request, _user: User = Depends(get_current_user)) -> APIResponse:
    """Cierra sesión eliminando la cookie."""
    host = request.headers.get("host", "").lower()
    is_local = "localhost" in host or "127.0.0.1" in host
    
    secure_cookie = _IS_PRODUCTION and not is_local
    samesite_cookie = "none" if secure_cookie else "lax"

    response.delete_cookie(
        key="token",
        httponly=True,
        secure=secure_cookie,
        samesite=samesite_cookie,
        path="/api",
    )
    return APIResponse(message="Sesión cerrada.")


@router.get("/me")
def get_me(user: User = Depends(get_current_user)) -> APIResponse:
    """Retorna los datos del usuario autenticado actual."""
    return APIResponse(
        message="OK",
        data=UserResponse(
            user_id=user.user_id,
            username=user.username,
            display_name=user.display_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
        ).model_dump(),
    )
