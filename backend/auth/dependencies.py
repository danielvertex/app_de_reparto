"""Dependencies de FastAPI para autenticación y autorización.

Uso en routers:
    from backend.auth.dependencies import get_current_user, require_role

    @router.get("/algo")
    def mi_endpoint(user: User = Depends(get_current_user)):
        ...

    @router.post("/admin-only")
    def admin_endpoint(user: User = Depends(require_role("owner"))):
        ...
"""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, Request, status

from backend.auth.models import User
from backend.auth.security import decode_access_token
from backend.auth import repository


def get_current_user(request: Request) -> User:
    """Extrae y valida el JWT de la cookie 'token'.

    Retorna el User autenticado o lanza HTTP 401.
    """
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado.",
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado.",
        )

    user = repository.find_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o desactivado.",
        )

    return user


def require_role(*roles: str) -> Callable:
    """Factory que retorna una dependency que verifica el rol del usuario.

    Ejemplo:
        Depends(require_role("owner"))
        Depends(require_role("owner", "employee"))
    """

    def _role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol: {', '.join(roles)}.",
            )
        return user

    return _role_checker
