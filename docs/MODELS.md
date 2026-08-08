# Where to find voice modules + how to load them

A **module** = a trained voice file you upload in the **Models** tab.

| File | Role |
|------|------|
| `.pth` / `.pt` | RVC v1/v2 voice model (needs PyTorch + HuBERT + fairseq) |
| `.onnx` | ONNX export of a voice model (needs onnxruntime — already installed) |
| `.index` | Optional FAISS index — better similarity / less artifacts |

## Already set up on this machine

| Asset | Path | Status |
|-------|------|--------|
| PyTorch | `.venv` | installed (CPU) |
| HuBERT | `models/assets/hubert_base.pt` | downloaded (~190 MB) |
| RMVPE | `models/assets/rmvpe/rmvpe.pt` | downloaded (~180 MB) |
| fairseq | `.venv` | installed (pure-Python build; no MSVC needed) |
| torchcrepe | `.venv` | installed |
| onnxruntime | `.venv` | installed |

**Right now:** `.onnx` modules can load. `.pth` RVC needs fairseq → install Build Tools, then:

```powershell
.\.venv\Scripts\Activate.ps1
pip install "fairseq @ git+https://github.com/Tps-F/fairseq.git@main"
pip install --no-deps git+https://github.com/RVC-Project/Retrieval-based-Voice-Conversion
```

## Where to download voice modules (legal / public)

Search for **RVC v2** models (`.pth`) shared by creators:

1. **Hugging Face** — search [`RVC`](https://huggingface.co/models?search=RVC) or [`rvc-models`](https://huggingface.co/models?search=rvc)
   - Example hub of weights: [lj1995/VoiceConversionWebUI](https://huggingface.co/lj1995/VoiceConversionWebUI) (base assets, not character voices)
2. **AI Hub / voice model boards** — communities post `.pth` + `.index` packs (always check license / consent)
3. **Train your own** — [RVC WebUI](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI) on your GPU with your own recordings

**Tips**
- Prefer **RVCv2** + matching `.index`
- Only use voices you have rights to (your own voice, or explicitly shared models)
- File size is often 50–150 MB per `.pth`

## Downloaded into this project

| Module (renamed) | Source | Voice |
|------------------|--------|-------|
| `yasmin_female.pth` + `.index` | [fahmifauzi/rvc-malaysian-voices](https://huggingface.co/fahmifauzi/rvc-malaysian-voices) (`suara_wanita_1`) | Yasmin (female) |
| `bunga_female.pth` + `.index` | same (`suara_wanita_2`) | Bunga (female) |
| `osman_male.pth` + `.index` | same (`suara_lelaki_1`) | Osman (male) |
| `ariff_male.pth` + `.index` | same (`suara_lelaki_2`) | Ariff (male) |
| `default_test.pth` + `.index` | [PhoenixStormJr/RVC-V2-default-voice](https://huggingface.co/PhoenixStormJr/RVC-V2-default-voice) | Creator test voice |

These are creator-shared packs (not celebrity clones). `.pth` activate still needs **fairseq** + VS C++ Build Tools on Windows.

## How to load in Shiftbooth

1. Open http://localhost:5173/ → **Models** tab  
2. Drop `.pth` / `.onnx` (+ `.index` if you have it)  
3. Click **Activate**  
4. Back to **Studio** → Start with headphones  

Or copy files into `models/` and refresh the Models list.

## Base assets (already done)

HuBERT / RMVPE came from:

https://huggingface.co/lj1995/VoiceConversionWebUI
