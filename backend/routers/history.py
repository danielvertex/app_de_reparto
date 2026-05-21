"""Router de historial y exportación."""

from __future__ import annotations

import csv
import io
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from delivery_app.domain.trip_manager import get_summary
from delivery_app.utils.time_utils import now_mx

from backend.dependencies import trip_service
from backend.schemas import APIResponse
from backend.auth.dependencies import get_current_user
from backend.auth.models import User

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
def list_history(_user: User = Depends(get_current_user)) -> APIResponse:
    """Lista los viajes archivados."""
    past_trips = trip_service.list_archived_trips()
    return APIResponse(message="OK", data={"past_trips": past_trips})


@router.get("/{trip_id}/export")
def export_route(trip_id: str, format: str = "full", _user: User = Depends(get_current_user)):
    """Exporta los datos de una jornada archivada como CSV."""
    valid_formats = {"full", "summary", "route", "deliveries"}
    if format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Formato '{format}' no válido. Usa: full, summary, route, deliveries.",
        )

    trip = trip_service.load_archived_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail=f"Jornada '{trip_id}' no encontrada.")

    output = io.StringIO()
    writer = csv.writer(output)

    if format in ("full", "deliveries"):
        # Resumen del viaje
        writer.writerow(["RESUMEN DEL VIAJE"])
        writer.writerow(["trip_id", "fecha", "km_planeados", "duracion_min", "litros_estimados", "costo_combustible_estimado"])
        writer.writerow([
        trip_id,
        trip.created_at.isoformat(),
        trip.metrics.planned_km or "",
        trip.metrics.planned_duration_min or "",
        trip.metrics.estimated_fuel_liters or "",
        f"{trip.metrics.estimated_fuel_cost:.2f}" if trip.metrics.estimated_fuel_cost else "",
        ])
        writer.writerow([])  # fila vacía de separación

        # Detalle de entregas
        writer.writerow(["delivery_id", "client_name", "latitude", "longitude", "status", "note", "reason", "completed_at"])
        for d in trip.deliveries:
            writer.writerow([
                d.delivery_id,
                d.client_name,
                d.coordinates.latitude,
                d.coordinates.longitude,
                d.status.value,
                d.note or "",
                d.reason or "",
                d.completed_at.isoformat() if d.completed_at else "",
            ])

    elif format == "summary":
        summary = get_summary(trip)
        writer.writerow(["campo", "valor"])
        for key, value in summary.items():
            writer.writerow([key, value])
        writer.writerow(["trip_date", trip.created_at.isoformat()])
        writer.writerow(["status", trip.status.value])

    elif format == "route":
        if not trip.route_plan:
            raise HTTPException(status_code=400, detail="Jornada sin ruta calculada.")
        writer.writerow(["sequence", "delivery_id", "client_name", "latitude", "longitude", "status"])
        deliveries_by_id = {d.delivery_id: d for d in trip.deliveries}
        for i, did in enumerate(trip.route_plan.optimized_order):
            d = deliveries_by_id.get(did)
            if d:
                writer.writerow([i + 1, d.delivery_id, d.client_name,
                                  d.coordinates.latitude, d.coordinates.longitude, d.status.value])

    output.seek(0)
    filename = f"viaje_{trip_id}_{format}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )