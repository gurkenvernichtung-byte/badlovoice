# Contributing to BadloVoice

Thanks for helping. The goal is a **local-first realtime voice changer** that stays easy on phone (Simple) and powerful in Pro.

## Before you start

1. Open an [issue](https://github.com/abuzar310/badlovoice/issues) for big ideas so we can align.
2. Keep PRs focused — one problem or feature per PR.
3. Never commit secrets (`.env`, `secrets/`, OAuth JSON, API keys, model weights under `models/` except documented assets placeholders).

## Dev setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt

cd frontend
npm install
npm run dev
```

Backend:

```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

## What to work on

| Area | Ideas |
|------|--------|
| Simple UI | Onboarding copy, empty states, accessibility |
| Audio | Gate/pitch quality, latency, recording edge cases |
| Models | Clearer install docs, sample model links (respect licenses) |
| Android | Release signing docs, permissions UX |
| Docs | Screenshots, Discord VAC videos, non-Windows install |

## PR checklist

- [ ] Runs locally (`npm run dev` + uvicorn)
- [ ] No secrets or large binary dumps
- [ ] UI matches existing BadloVoice coral / Simple patterns (or documents a deliberate change)
- [ ] Credit upstream if you port a pattern (see [ATTRIBUTION.md](ATTRIBUTION.md))

## Code of conduct

Be respectful. No harassment. Assume good intent. Maintainers may close off-topic or unsafe PRs.
