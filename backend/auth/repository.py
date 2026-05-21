"""Repositorio de usuarios — persistencia en JSON.

Sigue el mismo patrón que JsonTripRepository del dominio existente.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from backend.auth.models import User
from backend.auth.security import hash_password

logger = logging.getLogger(__name__)

# Ruta del archivo de usuarios — misma carpeta data/ que los trips
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"


def _ensure_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_users() -> list[User]:
    """Carga todos los usuarios desde el archivo JSON."""
    if not USERS_FILE.exists():
        return []
    try:
        raw = json.loads(USERS_FILE.read_text(encoding="utf-8"))
        return [User(**u) for u in raw]
    except (json.JSONDecodeError, Exception) as e:
        logger.error("Error al leer users.json: %s", e)
        return []


def save_users(users: list[User]) -> None:
    """Escribe la lista completa de usuarios al archivo JSON."""
    _ensure_dir()
    data = [u.model_dump() for u in users]
    USERS_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def find_by_username(username: str) -> Optional[User]:
    """Busca un usuario por su nombre de usuario (case-insensitive)."""
    for u in load_users():
        if u.username.lower() == username.lower():
            return u
    return None


def find_by_id(user_id: str) -> Optional[User]:
    """Busca un usuario por su ID."""
    for u in load_users():
        if u.user_id == user_id:
            return u
    return None


def add_user(username: str, display_name: str, plain_password: str, role: str) -> User:
    """Crea y persiste un nuevo usuario."""
    users = load_users()

    # Verificar duplicados
    if any(u.username.lower() == username.lower() for u in users):
        raise ValueError(f"El usuario '{username}' ya existe.")

    new_user = User(
        user_id=str(uuid.uuid4()),
        username=username,
        display_name=display_name,
        hashed_password=hash_password(plain_password),
        role=role,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    users.append(new_user)
    save_users(users)
    return new_user


def delete_user(user_id: str) -> bool:
    """Elimina un usuario por su ID. No permite eliminar al último owner."""
    users = load_users()
    target = None
    for u in users:
        if u.user_id == user_id:
            target = u
            break

    if not target:
        return False

    # Proteger al último owner
    if target.role == "owner":
        owner_count = sum(1 for u in users if u.role == "owner" and u.is_active)
        if owner_count <= 1:
            raise ValueError("No se puede eliminar al último usuario owner.")

    users = [u for u in users if u.user_id != user_id]
    save_users(users)
    return True


def update_password(user_id: str, new_plain_password: str) -> bool:
    """Actualiza la contraseña de un usuario."""
    users = load_users()
    for u in users:
        if u.user_id == user_id:
            u.hashed_password = hash_password(new_plain_password)
            save_users(users)
            return True
    return False


def seed_owner_if_empty() -> None:
    """Crea un usuario owner por defecto si no hay ningún usuario."""
    if load_users():
        return

    logger.warning(
        "⚠️  No hay usuarios. Creando owner por defecto: admin / changeme123. "
        "¡Cambia la contraseña inmediatamente!"
    )
    add_user(
        username="admin",
        display_name="Administrador",
        plain_password="changeme123",
        role="owner",
    )
