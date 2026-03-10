# AGENTS.md

## Project Stack

- **API**: FastAPI on Vercel (or standalone uvicorn)
- **Database**: PostgreSQL via SQLAlchemy + Alembic migrations
- **ML/Data**: PyTorch, pandas, numpy, scikit-learn
- **Testing**: pytest + httpx (async test client)

<!-- ── Stack Override ──────────────────────────
To change the default stack, uncomment and modify:
- Database: SQLite (update constitution.md too)
- ML: TensorFlow (update constitution.md too)
- ORM: Tortoise ORM (update constitution.md too)
───────────────────────────────────────────── -->

## Governance

Project principles are defined in `.specify/memory/constitution.md`. Edit the constitution directly to customize.

## Workflow

This project uses spec-kit for spec-driven development:

| Command | What it does |
|---------|-------------|
| `specify specify "feature"` | Creates a rich specification |
| `specify plan` | Creates the technical plan |
| `specify implement` | Implements it phase by phase |

Flow: specify → plan → implement

## Orchestration Rules

- Follow TDD: write the failing test first, then implement
- Commit after each completed phase
- Async all the way — use async handlers and async DB drivers

## Spec-Kit Integration

Feature artifacts live in `specs/NNN-feature-name/`:
- `spec.md` — what to build
- `plan.md` — how to build it
- `tasks.md` — implementation task breakdown

Constitution: `.specify/memory/constitution.md`
Templates: `.specify/templates/`
Scripts: `.specify/scripts/`
