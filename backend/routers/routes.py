"""Router de optimización de rutas."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from delivery_app.domain.trip_manager import get_pending_deliveries

from backend.dependencies import trip_service, routing_service
from backend.schemas import APIResponse
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.post("/optimize")
async def optimize_route(_user: User = Depends(get_current_user)) -> APIResponse:
    """Calcula la ruta óptima para las entregas pendientes."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="Agregue el punto de origen primero.")

    pending = get_pending_deliveries(trip)
    if not pending:
        return APIResponse(message="No hay entregas pendientes para optimizar.", data={})

    route_result = await routing_service.optimize(
        origin=trip.origin,
        deliveries=pending,
        return_mode=trip.return_mode,
        return_point=trip.return_point,
    )

    trip_service.update_route(trip, route_result)

    method_str = "OSRM" if route_result.method.value == "osrm" else "Fallback (Haversine)"
    return APIResponse(
        message=f"Ruta calculada ({method_str}): {route_result.total_distance_km} km en {route_result.total_duration_min} min.",
        data={
            "total_distance_km": route_result.total_distance_km,
            "total_duration_min": route_result.total_duration_min,
            "method": route_result.method.value,
            "optimized_order": route_result.optimized_order,
        },
    )
