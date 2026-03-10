# AGENTS.md

## Project Stack

- **Frontend + Backend**: Next.js (App Router) on Vercel
- **Database**: Neon Postgres via Drizzle ORM
- **Auth**: Better Auth with Drizzle adapter
- **Styling**: Tailwind CSS

<!-- ── Stack Override ──────────────────────────
To change the default stack, uncomment and modify:
- Database: Supabase Postgres (update constitution.md too)
- Auth: Clerk @clerk/nextjs (update constitution.md too)
- Styling: CSS Modules
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
- Run `/compact` after heavy workflows

## Spec-Kit Integration

Feature artifacts live in `specs/NNN-feature-name/`:
- `spec.md` — what to build
- `plan.md` — how to build it
- `tasks.md` — implementation task breakdown

Constitution: `.specify/memory/constitution.md`
Templates: `.specify/templates/`
Scripts: `.specify/scripts/`
