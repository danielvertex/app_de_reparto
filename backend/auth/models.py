"""Modelos de usuario y schemas de autenticación."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ─── Modelo de dominio ───

class User(BaseModel):
    """Usuario del sistema."""

    user_id: str
    username: str
    display_name: str
    hashed_password: str
    role: Literal["owner", "employee"]
    is_active: bool = True
    created_at: str  # ISO-8601


# ─── Schemas de request ───

class LoginRequest(BaseModel):
    """Datos para iniciar sesión."""

    username: str
    password: str


class UserCreateRequest(BaseModel):
    """Datos para crear un nuevo usuario."""

    username: str = Field(min_length=3, max_length=30)
    display_name: str = Field(min_length=1, max_length=60)
    password: str = Field(min_length=6)
    role: Literal["owner", "employee"] = "employee"


class PasswordChangeRequest(BaseModel):
    """Datos para cambiar contraseña."""

    new_password: str = Field(min_length=6)


# ─── Schemas de response ───

class UserResponse(BaseModel):
    """Datos de usuario visibles (sin contraseña)."""

    user_id: str
    username: str
    display_name: str
    role: str
    is_active: bool
    created_at: str
