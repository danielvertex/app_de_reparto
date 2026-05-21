"""Punto de entrada del backend FastAPI.

Registra todos los routers y configura CORS para el frontend PWA.
"""

from __future__ import annotations

import logging
import sys
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Asegurar que el directorio raíz del monorepo esté en sys.path
# para que 'backend' sea importable como paquete
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# delivery_app vive en src/mcp_entrega (clonado desde GitHub)
SRC_DIR = ROOT_DIR / "src" / "mcp_entrega"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import deliveries, config, routes, trips, history
from backend.routers import auth as auth_router
from backend.routers import users as users_router
from backend.auth.repository import seed_owner_if_empty

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evento de arranque: crea usuario owner por defecto si no existe."""
    seed_owner_if_empty()
    yield


app = FastAPI(
    title="Entrega de Productos API",
    description="API REST para la PWA de entregas de productos de limpieza",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir acceso desde el frontend Vite (dev) y producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "https://reparto.bluegreenpl.com",
        "https://repartoapp.bluegreenpl.com", # Nueva versión
        "https://reparto-pwa-5ia.pages.dev", # Producción
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(deliveries.router)
app.include_router(config.router)
app.include_router(routes.router)
app.include_router(trips.router)
app.include_router(history.router)


@app.get("/api/health")
def health_check():
    """Endpoint de salud para verificar que el servidor está activo."""
    return {"status": "ok", "service": "delivery-pwa-api"}

