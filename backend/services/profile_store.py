"""Settings profiles — echidna-inspired named full-session snapshots."""

from __future__ import annotations

import json
import logging
import re
import threading
import time
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

MAX_PROFILES = 40

LATENCY_MODES = {
    "ultra": {
        "id": "ultra",
        "label": "Ultra low",
        "chunk_size": 1024,
        "crossfade_ms": 4,
        "extra_buffer_chunks": 0,
        "blurb": "Lowest delay — may crackle on slow CPUs",
    },
    "balanced": {
        "id": "balanced",
        "label": "Balanced",
        "chunk_size": 4096,
        "crossfade_ms": 8,
        "extra_buffer_chunks": 1,
        "blurb": "Default for most machines",
    },
    "quality": {
        "id": "quality",
        "label": "Quality",
        "chunk_size": 8192,
        "crossfade_ms": 16,
        "extra_buffer_chunks": 2,
        "blurb": "Smoother SOLA/crossfade, higher latency",
    },
}


def _slug(name: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", name.strip().lower()).strip("-")
    return s or "profile"


class ProfileStore:
    def __init__(self, path: str | Path) -> None:
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._profiles: list[dict] = []
        self._load()

    def _load(self) -> None:
        if not self._path.is_file():
            return
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            self._profiles = list(data.get("profiles", []))
        except Exception:
            logger.exception("Failed to load profiles")

    def _save(self) -> None:
        self._path.write_text(
            json.dumps({"profiles": self._profiles}, indent=2),
            encoding="utf-8",
        )

    def list_profiles(self) -> list[dict]:
        with self._lock:
            return list(self._profiles)

    def save_profile(self, name: str, settings: dict) -> dict:
        with self._lock:
            if len(self._profiles) >= MAX_PROFILES:
                raise ValueError(f"Max {MAX_PROFILES} profiles")
            profile = {
                "id": f"{_slug(name)}-{uuid.uuid4().hex[:6]}",
                "name": name.strip()[:64] or "Untitled",
                "created_at": time.time(),
                "settings": settings,
            }
            self._profiles.append(profile)
            self._save()
            return profile

    def delete_profile(self, profile_id: str) -> None:
        with self._lock:
            before = len(self._profiles)
            self._profiles = [p for p in self._profiles if p.get("id") != profile_id]
            if len(self._profiles) == before:
                raise FileNotFoundError(profile_id)
            self._save()
