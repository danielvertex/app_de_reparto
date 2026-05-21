"""Router de entregas — CRUD de puntos de entrega."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from delivery_app.domain.enums import DeliveryStatus
from delivery_app.domain.validators import validate_delivery_input
from delivery_app.infrastructure.config import default_config
from delivery_app.ui.state_mapper import map_trip_to_state

from backend.dependencies import trip_service
from backend.schemas import APIResponse
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

router = APIRouter(prefix="/api/deliveries", tags=["deliveries"])


class AddPointRequest(BaseModel):
    client_name: str
    latitude: str
    longitude: str


class StatusUpdateRequest(BaseModel):
    status: str
    note: str = ""
    reason: str = ""


@router.get("")
def list_deliveries(_user: User = Depends(get_current_user)) -> APIResponse:
    """Lista las entregas de la jornada activa."""
    trip = trip_service.load_active_trip()
    if not trip:
        return APIResponse(message="No hay jornada activa.", data={"delivery_points": []})

    state = map_trip_to_state(trip, [])
    return APIResponse(
        message="OK",
        data={
            "delivery_points": state.get("delivery_points", []),
            "gmaps_link": state.get("gmaps_link", {}),
            "_pending": state.get("_pending", 0),
            "_completed": state.get("_completed", 0),
        },
    )


@router.post("")
def add_delivery_point(body: AddPointRequest, _user: User = Depends(get_current_user)) -> APIResponse:
    """Agrega un nuevo punto de entrega a la ruta."""
    try:
        lat = float(str(body.latitude).replace(",", "."))
        lon = float(str(body.longitude).replace(",", "."))
    except ValueError:
        raise HTTPException(status_code=400, detail="Coordenadas inválidas.")

    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="Agregue el punto de origen primero.")

    errors = validate_delivery_input(
        client_name=body.client_name,
        lat=lat,
        lon=lon,
        existing_deliveries=trip.deliveries,
        center_lat=trip.origin.coordinates.latitude,
        center_lon=trip.origin.coordinates.longitude,
        radius_km=default_config.bounding_box.radius_km,
    )
    if errors:
        msg = "\n".join(f"- {e.message}" for e in errors)
        raise HTTPException(status_code=422, detail=msg)

    updated_trip = trip_service.add_delivery(trip, body.client_name, lat, lon)
    state = map_trip_to_state(updated_trip, [])
    return APIResponse(
        message=f"Punto agregado: {body.client_name}",
        data={
            "delivery_points": state.get("delivery_points", []),
            "gmaps_link": state.get("gmaps_link", {}),
            "_pending": state.get("_pending", 0),
            "_completed": state.get("_completed", 0),
            "summary": state.get("summary"),
        },
    )


@router.delete("/{delivery_id}")
def remove_delivery_point(delivery_id: str, _user: User = Depends(get_current_user)) -> APIResponse:
    """Elimina un punto de entrega por su ID."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="No hay jornada activa.")

    try:
        updated_trip = trip_service.remove_delivery(trip, delivery_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    state = map_trip_to_state(updated_trip, [])
    return APIResponse(
        message="Punto eliminado.",
        data={
            "delivery_points": state.get("delivery_points", []),
            "gmaps_link": state.get("gmaps_link", {}),
            "_pending": state.get("_pending", 0),
            "_completed": state.get("_completed", 0),
            "summary": state.get("summary"),
        },
    )


@router.patch("/{delivery_id}/status")
def mark_delivery_status(delivery_id: str, body: StatusUpdateRequest, _user: User = Depends(get_current_user)) -> APIResponse:
    """Cambia el estado de una entrega."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="No hay jornada activa.")

    try:
        new_status = DeliveryStatus(body.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Estado '{body.status}' no válido.")

    try:
        updated_trip = trip_service.change_status(
            trip, delivery_id, new_status, note=body.note, reason=body.reason
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    state = map_trip_to_state(updated_trip, [])
    return APIResponse(
        message=f"Estado actualizado a {new_status.value}.",
        data={
            "delivery_points": state.get("delivery_points", []),
            "gmaps_link": state.get("gmaps_link", {}),
            "_pending": state.get("_pending", 0),
            "_completed": state.get("_completed", 0),
            "summary": state.get("summary"),
        },
    )
