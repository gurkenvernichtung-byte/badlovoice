from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from backend.services.profile_store import LATENCY_MODES

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def _store(request: Request):
    store = getattr(request.app.state, "profile_store", None)
    if store is None:
        raise HTTPException(status_code=503, detail="Profile store not initialized")
    return store


class SaveBody(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    settings: dict


@router.get("/latency-modes")
async def latency_modes() -> list[dict]:
    return list(LATENCY_MODES.values())


@router.get("/")
async def list_profiles(request: Request) -> list[dict]:
    return _store(request).list_profiles()


@router.post("/")
async def save_profile(request: Request, body: SaveBody) -> dict:
    try:
        return _store(request).save_profile(body.name, body.settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{profile_id}")
async def delete_profile(request: Request, profile_id: str) -> dict:
    try:
        _store(request).delete_profile(profile_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Profile not found") from None
    return {"status": "deleted", "id": profile_id}
