# Shiftbooth

<p align="center">
  <img src="frontend/public/favicon.svg" width="64" height="64" alt="Shiftbooth" />
</p>

<p align="center">
  <strong>Realtime AI voice changer for your browser</strong><br/>
  Mic or file → RVC / ONNX / DSP → speakers or WAV export.<br/>
  Audio stays on your machine.
</p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#features">Features</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#virtual-cable-routing">VAC routing</a> ·
  <a href="#configuration">Config</a> ·
  <a href="#attribution">Attribution</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/WebSocket-binary%20PCM-3DD6E0" alt="WebSocket" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
</p>

---

## What it does

Shiftbooth runs a local FastAPI server and a React studio UI. Your mic streams over a binary WebSocket. The server runs RVC or ONNX conversion when a model is loaded, or a full DSP chain when it is not. You hear the result live, record it, or convert a whole file offline.

Built by studying and merging the strongest parts of [OpenVoiceChanger](https://github.com/sioaeko/OpenVoiceChanger), [w-okada/voice-changer](https://github.com/w-okada/voice-changer), [Vonovox](https://github.com/dr87/Vonovox), and [echidna](https://github.com/supermarsx/echidna). Details in [ATTRIBUTION.md](ATTRIBUTION.md) and [findings.md](findings.md).

## Features

| Area | What you get |
|------|----------------|
| Realtime studio | AudioWorklet capture/playback, device pickers, VU + spectrum, latency sparkline |
| Models | Drag-drop `.pth` / `.pt` / `.onnx` + companion `.index`, one active model |
| Model slots | 5 hot-swap slots (w-okada pattern) |
| DSP rack | Noise gate, robot, whisper, telephone, distortion, bitcrush, chorus, echo, reverb, EQ, compressor, gain |
| DSP-only mode | Pitch + formant + effects with no checkpoint loaded |
| RVC controls | Pitch, formant, F0 method (PM / Harvest / Crepe / RMVPE / FCPE), index rate, RMS mix, protect |
| Latency modes | Ultra / Balanced / Quality → chunk size, crossfade, extra buffer |
| VAD assist | Talk-detect wiring into the noise gate (Vonovox-inspired) |
| Profiles | Save/load full session snapshots |
| Offline convert | Upload wav/mp3/flac/ogg/m4a → processed WAV |
| Recorder | Capture the converted stream and download WAV |

## Quick start

### Requirements

- Python 3.11+ recommended
- Node.js 20+
- Windows, macOS, or Linux
- Optional: NVIDIA GPU + CUDA for faster RVC/ONNX

### 1. Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

Optional RVC package:

```powershell
pip install --no-deps git+https://github.com/RVC-Project/Retrieval-based-Voice-Conversion
```

For RVC models, place HuBERT here:

```text
models/assets/hubert_base.pt
```

Start the API:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Health check: http://127.0.0.1:8000/health

### 2. Frontend (dev)

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` and `/ws` to port 8000.

### 3. Production (UI served by FastAPI)

```powershell
cd frontend
npm install
npm run build
cd ..
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000

### First voice change

1. Allow mic access in the browser.
2. Pick input / output devices in **Studio**.
3. Either load an RVC/ONNX model under **Models**, or stay in DSP-only mode.
4. Hit start and talk. Tweak pitch, presets, or the effects rack live.
5. Use **Converter** for whole-file renders.

## Architecture

```text
Browser (React + AudioWorklet)
    │  binary PCM frames + JSON settings
    ▼
FastAPI  /ws/audio
    │  gate → model (RVC/ONNX) or pitch DSP → effect rack
    ▼
Browser playback + optional WAV recorder
```

| Path | Role |
|------|------|
| `backend/` | FastAPI app, WebSocket pipeline, model/slot/preset/profile managers, DSP |
| `frontend/` | Shiftbooth studio UI |
| `models/` | Your checkpoints + `assets/` (HuBERT, RMVPE, …) |
| `data/` | Runtime presets, slots, profiles (gitignored) |

## Virtual cable routing

For Discord, games, or OBS, route Shiftbooth output through a virtual cable:

1. Install [VAC](https://software.muzychenko.net/freeware/vac470lite.zip) (preferred over VB-Cable for fewer glitches).
2. Set mic + virtual line to **48000 Hz**, 1 channel, 16-bit when possible.
3. Shiftbooth **input** = real mic. **Output** = Line 1 (VAC).
4. Windows Sound → Recording → Line 1 → **Listen to this device** if you want local monitor.
5. In Discord/games, set microphone to Line 1.

Remote GPU box (w-okada style): run the backend on the GPU machine, open the UI from your gaming PC over the network, keep chunk size / latency mode honest for your link.

## Configuration

Environment prefix: `SHIFTBOOTH_`

| Variable | Default | Notes |
|----------|---------|--------|
| `SHIFTBOOTH_HOST` | `0.0.0.0` | Bind address |
| `SHIFTBOOTH_PORT` | `8000` | HTTP + WS port |
| `SHIFTBOOTH_MODELS_DIR` | `models` | Checkpoint directory |
| `SHIFTBOOTH_SAMPLE_RATE` | `40000` | Stream default |
| `SHIFTBOOTH_CHUNK_SIZE` | `4096` | Overridden by latency modes in the UI |
| `SHIFTBOOTH_HUBERT_PATH` | `models/assets/hubert_base.pt` | RVC content encoder |
| `SHIFTBOOTH_DEFAULT_LATENCY_MODE` | `balanced` | `ultra` / `balanced` / `quality` |

See `backend/config.py` for the full list.

## Project scripts

From repo root:

```powershell
npm run dev       # frontend Vite
npm run build     # frontend production build
npm run server    # uvicorn backend.main:app
```

## License

MIT — see [LICENSE](LICENSE).

Upstream OpenVoiceChanger code is MIT (Sioaeko). Other projects contributed design patterns; see [ATTRIBUTION.md](ATTRIBUTION.md).

## Attribution

| Project | Contribution |
|---------|----------------|
| [OpenVoiceChanger](https://github.com/sioaeko/OpenVoiceChanger) | Primary web stack: FastAPI, binary WS, AudioWorklet, DSP rack, RVC/ONNX, offline convert |
| [w-okada/voice-changer](https://github.com/w-okada/voice-changer) | Model slots, crossfade/buffer controls, remote client idea |
| [Vonovox](https://github.com/dr87/Vonovox) | VAD/noise-gate assist, VAC guidance, sample-rate flexibility |
| [echidna](https://github.com/supermarsx/echidna) | Latency modes, settings profiles |

## Contributing

Issues and PRs welcome. Keep changes focused. Credit upstream patterns in the PR when you port another idea from the research set.
