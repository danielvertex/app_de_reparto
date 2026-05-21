"""Router de gestión de usuarios — solo para owners."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.models import (
    PasswordChangeRequest,
    User,
    UserCreateRequest,
    UserResponse,
)
from backend.auth import repository
from backend.auth.dependencies import get_current_user, require_role
from backend.schemas import APIResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
def list_users(_user: User = Depends(require_role("owner"))) -> APIResponse:
    """Lista todos los usuarios (sin contraseñas)."""
    users = repository.load_users()
    return APIResponse(
        message="OK",
        data=[
            UserResponse(
                user_id=u.user_id,
                username=u.username,
                display_name=u.display_name,
                role=u.role,
                is_active=u.is_active,
                created_at=u.created_at,
            ).model_dump()
            for u in users
        ],
    )


@router.post("")
def create_user(
    body: UserCreateRequest,
    _user: User = Depends(require_role("owner")),
) -> APIResponse:
    """Crea un nuevo usuario."""
    try:
        new_user = repository.add_user(
            username=body.username,
            display_name=body.display_name,
            plain_password=body.password,
            role=body.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return APIResponse(
        message=f"Usuario '{new_user.username}' creado.",
        data=UserResponse(
            user_id=new_user.user_id,
            username=new_user.username,
            display_name=new_user.display_name,
            role=new_user.role,
            is_active=new_user.is_active,
            created_at=new_user.created_at,
        ).model_dump(),
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    _user: User = Depends(require_role("owner")),
) -> APIResponse:
    """Elimina un usuario por su ID."""
    try:
        deleted = repository.delete_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    return APIResponse(message="Usuario eliminado.")


@router.patch("/{user_id}/password")
def change_password(
    user_id: str,
    body: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
) -> APIResponse:
    """Cambia la contraseña de un usuario.

    - Un owner puede cambiar la contraseña de cualquiera.
    - Un employee solo puede cambiar su propia contraseña.
    """
    if current_user.role != "owner" and current_user.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Solo puedes cambiar tu propia contraseña.",
        )

    updated = repository.update_password(user_id, body.new_password)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    return APIResponse(message="Contraseña actualizada.")
