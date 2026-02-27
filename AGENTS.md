# Project Instructions

## Working Style

- Keep changes small, targeted, and easy to review.
- Prefer fixing root causes over quick patches.
- Do not commit or expose secrets from `.env*` files.
- Before major refactors, outline the intended approach first.

## Code Quality

- Preserve existing architecture and naming conventions in each subproject.
- Add concise comments only where logic is non-obvious.
- Avoid touching unrelated files while implementing a task.
- Run relevant checks/tests for changed areas when possible.

## Repo Awareness

- This repository contains multiple projects; treat each as an independent codebase with its own conventions.
- Prefer project-local dependencies/config over introducing broad repo-wide changes.
