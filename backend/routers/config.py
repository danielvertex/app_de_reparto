"""Router de configuración — origen, retorno, combustible."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from delivery_app.domain.enums import ReturnMode
from delivery_app.domain.models import Coordinates, FuelConfig, NamedPoint
from delivery_app.ui.state_mapper import map_trip_to_state

from backend.dependencies import trip_service
from backend.schemas import APIResponse

router = APIRouter(prefix="/api/config", tags=["config"])


class OriginRequest(BaseModel):
    name: str
    latitude: str
    longitude: str


class ReturnRequest(BaseModel):
    mode: str
    custom_name: Optional[str] = ""
    custom_lat: Optional[str] = "0"
    custom_lon: Optional[str] = "0"


class FuelRequest(BaseModel):
    km_per_liter: str
    price_per_liter: str


@router.put("/origin")
def update_origin(body: OriginRequest) -> APIResponse:
    """Configura el punto de partida y crea la jornada si no existe."""
    try:
        lat = float(str(body.latitude).replace(",", ".").strip())
        lon = float(str(body.longitude).replace(",", ".").strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="Coordenadas inválidas.")

    origin = NamedPoint(name=body.name, coordinates=Coordinates(latitude=lat, longitude=lon))

    trip = trip_service.load_active_trip()
    if trip:
        updated_trip = trip_service.update_origin(trip, origin)
    else:
        updated_trip = trip_service.get_or_create_trip(origin)

    state = map_trip_to_state(updated_trip, [])
    return APIResponse(
        message=f"Origen configurado: {body.name}",
        data={
            "origin": state.get("origin"),
            "delivery_points": state.get("delivery_points", []),
            "gmaps_link": state.get("gmaps_link"),
            "_pending": state.get("_pending", 0),
            "_completed": state.get("_completed", 0),
            "summary": state.get("summary"),
        },
    )


@router.put("/return")
def update_return_config(body: ReturnRequest) -> APIResponse:
    """Configura el comportamiento de retorno al finalizar."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="Agregue el punto de origen primero.")

    try:
        return_mode = ReturnMode(body.mode)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Modo '{body.mode}' inválido.")

    return_point = None
    if return_mode == ReturnMode.CUSTOM:
        try:
            lat = float(str(body.custom_lat).replace(",", ".").strip())
            lon = float(str(body.custom_lon).replace(",", ".").strip())
            return_point = NamedPoint(
                name=body.custom_name or "Punto personalizado",
                coordinates=Coordinates(latitude=lat, longitude=lon),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Coordenadas personalizadas inválidas.")

    updated_trip = trip_service.update_return_config(trip, return_mode, return_point)
    state = map_trip_to_state(updated_trip, [])

    return APIResponse(
        message=f"Retorno configurado: {return_mode.value}",
        data={
            "return_config": state.get("return_config"),
            "gmaps_link": state.get("gmaps_link"),
        },
    )


@router.put("/fuel")
def update_fuel_config(body: FuelRequest) -> APIResponse:
    """Configura los parámetros de combustible."""
    trip = trip_service.load_active_trip()
    if not trip:
        raise HTTPException(status_code=400, detail="Agregue el punto de origen primero.")

    try:
        kpl = float(str(body.km_per_liter).replace(",", ".").strip())
        ppl = float(str(body.price_per_liter).replace(",", ".").strip())
        if kpl <= 0:
            raise ValueError("Rendimiento debe ser mayor a 0.")
        if ppl < 0:
            raise ValueError("Precio no puede ser negativo.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    fc = FuelConfig(km_per_liter=kpl, fuel_price=ppl)
    updated_trip = trip_service.update_fuel_config(trip, fc)
    state = map_trip_to_state(updated_trip, [])

    return APIResponse(
        message="Configuración de combustible guardada.",
        data={
            "fuel_config": state.get("fuel_config"),
            "summary": state.get("summary"),
        },
    )
