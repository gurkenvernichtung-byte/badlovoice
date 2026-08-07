# Shiftbooth

Realtime AI voice changer that merges the strongest pieces of:

| Source | What we took |
|--------|----------------|
| [OpenVoiceChanger](https://github.com/sioaeko/OpenVoiceChanger) | FastAPI + binary WebSocket + AudioWorklet + DSP rack + RVC/ONNX + offline convert |
| [w-okada/voice-changer](https://github.com/w-okada/voice-changer) | Model slots, crossfade/buffer controls, remote GPU-box workflow |
| [Vonovox](https://github.com/dr87/Vonovox) | VAD/noise-gate assist, VAC routing guide, sample-rate flexibility |
| [echidna](https://github.com/supermarsx/echidna) | Latency modes + settings profiles |

See [ATTRIBUTION.md](ATTRIBUTION.md) and [findings.md](findings.md).

## Features

- Realtime mic → model/DSP → speakers over WebSocket
- **DSP-only mode** when no model loaded (pitch + 12-effect rack)
- RVC (`.pth`) + ONNX models, drag-drop upload + companion `.index`
- **5 model slots** for hot-swap
- **Latency modes**: Ultra / Balanced / Quality
- **VAD / noise gate** silence mute
- **Profiles** for full session snapshots
- Offline file converter → WAV
- VU, spectrum, latency sparkline (model / DSP / network)

## Quick start (Windows PowerShell)

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
# Optional RVC:
# pip install --no-deps git+https://github.com/RVC-Project/Retrieval-based-Voice-Conversion
```

Place HuBERT for RVC:

```text
models/assets/hubert_base.pt
```

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Frontend (dev)

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (proxies `/api` + `/ws` to :8000).

### Production UI via backend

```powershell
cd frontend
npm run build
cd ..
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000

## Env

Prefix `SHIFTBOOTH_` — see `backend/config.py` (`MODELS_DIR`, `SAMPLE_RATE`, `CHUNK_SIZE`, …).

## Research clones

Deep analysis clones live under `.research/` (gitignored). Not required to run the app.
