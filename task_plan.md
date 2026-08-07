# Task Plan — Shiftbooth merge

## Goal

One product: Shiftbooth realtime voice changer with best features from OVC / w-okada / Vonovox / echidna.

## Phases

### Phase 1 — Scaffold monorepo ✅
- [x] Research clones + findings
- [x] Copy OVC backend + frontend skeleton
- [x] Keep Shiftbooth brand / CSS tokens
- [x] ATTRIBUTION.md

### Phase 2 — Backend merge ✅
- [x] FastAPI app branded Shiftbooth
- [x] Model slots (5) on SlotManager
- [x] Latency modes → chunk defaults
- [x] VAD/noise-gate settings on WS config
- [x] Profiles API
- [x] Crossfade/extra-buffer settings on WS

### Phase 3 — Frontend merge ✅
- [x] AudioWorklet + WS pipeline from OVC
- [x] Studio: devices, VU, spectrum, latency
- [x] Effects rack + presets
- [x] Model bay with slots
- [x] File converter
- [x] Profiles + latency mode selector
- [x] VAC / routing guide panel

### Phase 4 — Verify ✅
- [x] Frontend build
- [x] Backend syntax smoke
- [x] README run instructions

## Status

Complete for merge v1. RVC GPU path needs local `hubert_base.pt` + optional RVC pip install.
