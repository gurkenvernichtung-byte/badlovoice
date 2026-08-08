# Security

## Supported versions

Please report issues against the latest `master` branch.

## Reporting a vulnerability

Open a private security advisory on GitHub if available, or email the maintainer via the GitHub profile linked to this repo.

Do **not** open a public issue for:

- Auth bypasses or remote code execution
- Secrets accidentally committed (request removal + rotation)

Include: affected path, impact, and steps to reproduce.

## Local-first note

BadloVoice is designed to process audio on your machine. Treat model files and mic access like any privileged local app. Do not expose the backend to the public internet without authentication and hardening.
