"""Router de historial y exportación."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from delivery_app.domain.trip_manager import get_summary
from delivery_app.utils.time_utils import now_mx

from backend.dependencies import trip_service
from backend.schemas import APIResponse

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def list_history() -> APIResponse:
    """Lista los viajes archivados."""
    past_trips = trip_service.list_archived_trips()
    return APIResponse(message="OK", data={"past_trips": past_trips})


@router.get("/{trip_id}/export")
def export_route(trip_id: str, format: str = "full") -> APIResponse:
    """Exporta los datos de una jornada archivada."""
    valid_formats = {"full", "summary", "route", "deliveries"}
    if format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Formato '{format}' no válido. Usa: full, summary, route, deliveries.",
        )

    trip = trip_service.load_archived_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail=f"Jornada '{trip_id}' no encontrada.")

    exported_at = now_mx().isoformat()
    data = {}

    if format == "full":
        data = trip.model_dump(mode="json")
    elif format == "summary":
        data = get_summary(trip)
        data["trip_date"] = trip.created_at.isoformat()
        data["closed_at"] = trip.closed_at.isoformat() if trip.closed_at else None
        data["status"] = trip.status.value
    elif format == "route":
        if not trip.route_plan:
            raise HTTPException(status_code=400, detail="Jornada sin ruta calculada.")

        ordered_ids = trip.route_plan.optimized_order
        deliveries_by_id = {d.delivery_id: d for d in trip.deliveries}
        stops = []
        for i, did in enumerate(ordered_ids):
            d = deliveries_by_id.get(did)
            if d:
                stops.append({
                    "sequence": i + 1,
                    "delivery_id": d.delivery_id,
                    "client_name": d.client_name,
                    "latitude": d.coordinates.latitude,
                    "longitude": d.coordinates.longitude,
                    "status": d.status.value,
                })
        data = {
            "origin": {
                "name": trip.origin.name,
                "latitude": trip.origin.coordinates.latitude,
                "longitude": trip.origin.coordinates.longitude,
            },
            "stops": stops,
            "total_distance_km": trip.route_plan.total_distance_km,
            "total_duration_min": trip.route_plan.total_duration_min,
            "return_mode": trip.return_mode.value,
            "method": trip.route_plan.method.value,
        }
    elif format == "deliveries":
        data = {
            "total": len(trip.deliveries),
            "deliveries": [
                {
                    "delivery_id": d.delivery_id,
                    "client_name": d.client_name,
                    "latitude": d.coordinates.latitude,
                    "longitude": d.coordinates.longitude,
                    "status": d.status.value,
                    "note": d.note,
                    "reason": d.reason,
                    "completed_at": d.completed_at.isoformat() if d.completed_at else None,
                }
                for d in trip.deliveries
            ],
        }

    result = {"trip_id": trip_id, "exported_at": exported_at, "format": format, "data": data}

    # Guardar en disco
    exports_dir = Path("data/exports")
    exports_dir.mkdir(parents=True, exist_ok=True)
    export_file = exports_dir / f"export_{trip_id}_{format}.json"
    export_file.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    return APIResponse(message=f"Exportado a data/exports/", data=result)
