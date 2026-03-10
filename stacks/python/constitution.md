# Project Constitution

> This file defines the principles that govern all development in this project.
> The constitutional-validator agent enforces these during `/design`.
> Edit freely — this is YOUR project's constitution.

## Stack Principles

- **FastAPI** — Async route handlers by default. Use dependency injection (`Depends()`) for database sessions, auth, and shared logic. Define Pydantic schemas for all request/response shapes.
- **PostgreSQL** — Production database. Use connection pooling in serverless environments. Index every column used in WHERE, JOIN, or ORDER BY.
- **SQLAlchemy** — All database access through SQLAlchemy ORM or Core. No raw SQL in application code unless it's a migration or one-off script. Define models in `src/models/` with one file per entity.
- **Alembic** — All schema changes go through Alembic migrations. Never modify production schemas manually. `alembic revision --autogenerate` for development, reviewed migrations for production.
- **PyTorch / pandas / scikit-learn** — ML and data processing. Models in `src/models/ml/`, data pipelines in `src/pipelines/`. Reproducibility via seed management and versioned datasets.
- **Pydantic** — Validate all external inputs. Define explicit schemas — never return raw dicts or model objects from endpoints.

## Engineering Principles

- **Test-Driven Development** — Write the test first. Watch it fail. Write minimal code to pass. Refactor. No exceptions without explicit human approval.
- **Simplicity over cleverness** — No over-engineering. No premature abstractions. Three similar lines are better than one clever abstraction.
- **Type hints everywhere** — Use `mypy --strict` or equivalent. No `Any` types. No `# type: ignore`. Define named types for complex shapes.
- **One responsibility per file** — Split at ~200 lines.
- **Early returns** — Guard against invalid states at the top. Avoid deep nesting.
- **No dead code** — Remove unused imports, variables, and functions immediately.
- **Test at boundaries** — Validate user input and external APIs. Trust internal code and framework guarantees.
- **Async all the way** — Use async route handlers and async database drivers. Never mix sync blocking calls into async code.

## AI Collaboration Principles

- **Specs before code** — Always `/spec` before `/build`. Understand what you're building before building it.
- **Human approves at gates** — AI proposes, human decides. Every implementation phase requires explicit user approval.
- **Constitutional compliance** — The validator agent checks plans against this document. Violations block implementation.
- **Commit often** — At least once per completed task. Small, reversible commits.
- **Context hygiene** — Run `/compact` after heavy workflows. Start fresh sessions for unrelated tasks.

## Quality Gates

Before any phase is considered complete:

- [ ] All deliverables implemented
- [ ] Tests pass (pytest unit + integration)
- [ ] Type checks pass (mypy/pyright)
- [ ] Lint passes (ruff)
- [ ] Code review approved
- [ ] User validation received

## Stack Override

<!-- Uncomment and modify to change the default stack for this project:
- Database: SQLite (replace PostgreSQL references above)
- ORM: Tortoise ORM (replace SQLAlchemy references above)
- ML: TensorFlow (replace PyTorch references above)
-->
