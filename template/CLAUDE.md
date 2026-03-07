# CLAUDE.md

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

Project principles are defined in `.specify/memory/constitution.md`. The `constitutional-validator` agent enforces them during `/design`. Edit the constitution directly to customize.

## Agents

| Agent | Model | Color | Role |
|-------|-------|-------|------|
| architect | opus | blue | System design, data modeling, API contracts |
| product-manager | sonnet | green | User stories, acceptance criteria, scope |
| ux-designer | sonnet | purple | Flows, states, accessibility |
| code-reviewer | sonnet | yellow | Correctness, TDD, security, maintainability |
| constitutional-validator | opus | red | Constitution compliance gate |

## Workflow

Three commands power the spec-driven development cycle:

| Command | What it does |
|---------|-------------|
| `/spec "feature"` | Creates a rich specification — spec-kit generates the base, then PM and UX agents enrich it |
| `/design` | Creates the technical plan — spec-kit generates the base, then architect reviews and validator gates it |
| `/build` | Implements phase by phase — TDD enforced, Playwright testing, code review, user approval at every gate |

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
