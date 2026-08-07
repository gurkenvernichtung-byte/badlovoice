import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.routers import convert, models, presets, profiles, slots, websocket
from backend.services.model_manager import ModelManager
from backend.services.preset_store import PresetStore
from backend.services.profile_store import LATENCY_MODES, ProfileStore
from backend.services.slot_manager import SlotManager

_onnx_available = False
_torch_available = False
_onnxruntime = None
_torch = None
try:
    import onnxruntime as _onnxruntime

    _onnx_available = True
except ImportError:
    pass
try:
    import torch as _torch

    _torch_available = True
except ImportError:
    pass

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _get_onnx_runtime_info() -> dict:
    providers: list[str] = []
    if _onnx_available and _onnxruntime is not None:
        try:
            providers = list(_onnxruntime.get_available_providers())
        except Exception:
            logger.exception("Failed to inspect ONNX Runtime providers")

    active_provider = None
    selected_providers: list[str] = []
    gpu_enabled = False
    if "CUDAExecutionProvider" in providers:
        active_provider = "CUDAExecutionProvider"
        selected_providers = ["CUDAExecutionProvider"]
        if "CPUExecutionProvider" in providers:
            selected_providers.append("CPUExecutionProvider")
        gpu_enabled = True
    elif "CPUExecutionProvider" in providers:
        active_provider = "CPUExecutionProvider"
        selected_providers = ["CPUExecutionProvider"]
    elif providers:
        active_provider = providers[0]
        selected_providers = [providers[0]]

    return {
        "available": _onnx_available,
        "activeProvider": active_provider,
        "selectedProviders": selected_providers,
        "availableProviders": providers,
        "gpuEnabled": gpu_enabled,
    }


def _get_torch_runtime_info() -> dict:
    info = {
        "available": _torch_available,
        "device": "unavailable",
        "gpuName": None,
        "cudaAvailable": False,
        "cudaVersion": None,
    }

    if not _torch_available or _torch is None:
        return info

    try:
        if hasattr(_torch, "xpu") and _torch.xpu.is_available():
            info["device"] = "xpu:0"
            get_device_name = getattr(_torch.xpu, "get_device_name", None)
            info["gpuName"] = get_device_name(0) if callable(get_device_name) else "Intel XPU"
        elif _torch.cuda.is_available():
            info["device"] = "cuda:0"
            info["gpuName"] = _torch.cuda.get_device_name(0)
            info["cudaAvailable"] = True
            info["cudaVersion"] = _torch.version.cuda
        elif hasattr(_torch.backends, "mps") and _torch.backends.mps.is_available():
            info["device"] = "mps"
            info["gpuName"] = "Apple GPU"
        else:
            info["device"] = "cpu"
            info["gpuName"] = "CPU only"
    except Exception:
        logger.exception("Failed to inspect PyTorch runtime")

    return info


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Shiftbooth backend")
    logger.info("Models directory: %s", settings.MODELS_DIR)
    logger.info("ONNX Runtime: %s", "available" if _onnx_available else "missing")
    logger.info("PyTorch: %s", "available" if _torch_available else "missing")

    manager = ModelManager(settings.MODELS_DIR)
    app.state.model_manager = manager
    app.state.preset_store = PresetStore(settings.PRESETS_PATH)
    app.state.slot_manager = SlotManager(settings.SLOTS_PATH, manager)
    app.state.profile_store = ProfileStore(settings.PROFILES_PATH)

    logger.info("Ready on %s:%d", settings.HOST, settings.PORT)
    yield

    logger.info("Shutting down")
    manager.deactivate_model()


app = FastAPI(
    title="Shiftbooth",
    description="Realtime AI voice changer — RVC/ONNX + DSP rack",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok", "product": "shiftbooth"}


@app.get("/api/config")
async def get_config():
    mode = LATENCY_MODES.get(settings.DEFAULT_LATENCY_MODE, LATENCY_MODES["balanced"])
    return {
        "version": app.version,
        "product": "shiftbooth",
        "sample_rate": settings.SAMPLE_RATE,
        "chunk_size": settings.CHUNK_SIZE,
        "latency_mode": mode,
        "latency_modes": list(LATENCY_MODES.values()),
        "features": {
            "model_slots": True,
            "profiles": True,
            "dsp_passthrough": True,
            "vad_gate": True,
            "offline_convert": True,
            "sola_crossfade": True,
            "virtual_cable_guide": True,
        },
        "onnx_available": _onnx_available,
        "torch_available": _torch_available,
        "runtime": {
            "onnx": _get_onnx_runtime_info(),
            "torch": _get_torch_runtime_info(),
        },
    }


app.include_router(models.router)
app.include_router(presets.router)
app.include_router(convert.router)
app.include_router(websocket.router)
app.include_router(slots.router)
app.include_router(profiles.router)

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
    logger.info("Serving frontend from %s", frontend_dist)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=False,
    )
