# CLAUDE.md

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

Project principles are defined in `.specify/memory/constitution.md`. The `constitutional-validator` agent enforces them during `/design`. Edit the constitution directly to customize.

## Agents

| Agent | Model | Color | Role |
|-------|-------|-------|------|
| architect | opus | blue | System design, data modeling, API contracts |
| product-manager | sonnet | green | User stories, acceptance criteria, scope |
| data-analyst | sonnet | purple | Data pipelines, model I/O, validation schemas |
| code-reviewer | sonnet | yellow | Correctness, TDD, security, maintainability |
| constitutional-validator | opus | red | Constitution compliance gate |

## Workflow

Three commands power the spec-driven development cycle:

| Command | What it does |
|---------|-------------|
| `/spec "feature"` | Creates a rich specification — spec-kit generates the base, then PM and data analyst agents enrich it |
| `/design` | Creates the technical plan — spec-kit generates the base, then architect reviews and validator gates it |
| `/build` | Implements phase by phase — TDD enforced, pytest testing, code review, user approval at every gate |

Flow: `/spec` → `/design` → `/build`

Spec-kit's raw commands (`/speckit.specify`, `/speckit.plan`, `/speckit.implement`) are also available for simpler tasks that don't need agent enrichment.

## Orchestration Rules

- **Task tool** for agents (never bash)
- **Skill tool** for spec-kit skills and standalone skills (never Task)
- Run `/compact` after `/design` and `/build` — these are context-heavy workflows
- Commit after each completed phase in `/build`

## Spec-Kit Integration

Feature artifacts live in `specs/NNN-feature-name/`:
- `spec.md` — what to build (created by `/spec`)
- `plan.md` — how to build it (created by `/design`)
- `tasks.md` — implementation task breakdown (created by `/design`)

Constitution: `.specify/memory/constitution.md`
Templates: `.specify/templates/`
Scripts: `.specify/scripts/`
