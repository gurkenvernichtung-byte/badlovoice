# Findings — voice changer repo merge

## Sources

| Repo | Path | License | Role |
|------|------|---------|------|
| OpenVoiceChanger | `.research/OpenVoiceChanger` | MIT | **Primary architecture** |
| w-okada/voice-changer | `.research/voice-changer` | custom/CLA | Slots, SOLA/crossfade, multi-engine, remote client |
| Vonovox | `.research/Vonovox` | (source mostly Cython `.pyd`) | CUDA latency, VAD, RNNoise, AP-BWE, VAC routing |
| echidna | `.research/echidna` | see license.md | Latency modes, profiles, system routing concepts |

## Best-at matrix

| Capability | Winner | Why |
|------------|--------|-----|
| Web stack (React+WS+AudioWorklet) | OpenVoiceChanger | Clean FastAPI, binary WS protocol, DSP passthrough |
| Model slots / remote PC split | w-okada | Slot manager, server-device mode, multi-VC engines |
| Lowest CUDA latency / quality | Vonovox | Full GPU pipeline, FCPE/RMVPE, Cython, AP-BWE 48k |
| System-wide / call injection | echidna | Zygisk/AAudio hooks — Android only |
| Effects rack + presets | OpenVoiceChanger | 12 streaming DSP FX + 16 presets, model-free mode |
| Offline file convert | OpenVoiceChanger | Upload → model+FX → WAV |
| Crossfade/SOLA seamlessness | w-okada | VoiceChangerV2 sola + crossfade |
| Mic noise / talk detect | Vonovox | RNNoise + Silero VAD |

## Cannot literally merge

- Vonovox core is compiled `.pyd` (no portable source) + NVIDIA-only
- echidna is Android Magisk/Zygisk — transfer **concepts only**
- w-okada full multi-engine stack is huge; take patterns not whole tree

## Merge decision

Build **Shiftbooth** as OVC-based monorepo + Shiftbooth UI + ported concepts:

1. OVC: WS pipeline, DSP rack, models, presets, recorder, offline convert
2. w-okada: model slots, latency/chunk profiles, crossfade settings UI
3. Vonovox: VAD gate, noise reduction emphasis, VAC setup docs, SR flexibility
4. echidna: LatencyMode + Settings profiles + telemetry strip
