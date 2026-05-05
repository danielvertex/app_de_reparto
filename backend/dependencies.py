"""Inyección de dependencias para la API.

Crea las instancias de servicios que los routers necesitan,
reutilizando la lógica completa del paquete delivery_app.
"""

from __future__ import annotations

from pathlib import Path

from delivery_app.infrastructure.config import default_config
from delivery_app.infrastructure.json_repository import JsonTripRepository
from delivery_app.infrastructure.osrm_client import OSRMClient
from delivery_app.services.routing_service import RoutingService
from delivery_app.services.trip_service import TripService

# Persistencia: misma carpeta data/ en la raíz del monorepo
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_repo = JsonTripRepository(DATA_DIR)
_osrm = OSRMClient(default_config.osrm)

trip_service = TripService(_repo)
routing_service = RoutingService(_osrm, default_config)
