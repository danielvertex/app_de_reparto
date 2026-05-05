"""Modelos de respuesta estándar para la API REST."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class APIResponse(BaseModel):
    """Envoltorio estándar para todas las respuestas."""

    success: bool = True
    message: str = ""
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Respuesta de error."""

    success: bool = False
    message: str
    detail: Optional[str] = None
