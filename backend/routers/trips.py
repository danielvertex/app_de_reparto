"""Router de gestión de viaje/jornada."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from delivery_app.ui.state_mapper import map_trip_to_state

from backend.dependencies import trip_service
from backend.schemas import APIResponse

router = APIRouter(prefix="/api/trip", tags=["trip"])


@router.get("")
def get_active_trip() -> APIResponse:
    """Retorna el estado completo del viaje activo."""
    trip = trip_service.load_active_trip()
    past_trips = trip_service.list_archived_trips()
    state = map_trip_to_state(trip, past_trips)

    if trip:
        state["summary"] = trip_service.get_summary(trip)

    return APIResponse(message="OK", data=state)


@router.post("/close")
def close_day() -> APIResponse:
    """Cierra la jornada activa y archiva los datos."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="No hay jornada activa para cerrar.")

    closed = trip_service.close_day(trip)
    past_trips = trip_service.list_archived_trips()
    state = map_trip_to_state(None, past_trips)

    return APIResponse(
        message=f"Jornada cerrada (ID: {closed.trip_id}).",
        data=state,
    )
