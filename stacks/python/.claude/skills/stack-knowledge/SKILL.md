---
name: stack-knowledge
description: Project technology stack patterns for FastAPI + PostgreSQL + SQLAlchemy + Alembic + PyTorch + pandas
user-invocable: false
---

# Stack Knowledge

This skill provides stack-specific patterns for agents making architectural and implementation decisions.

## FastAPI

- Async route handlers by default — use `async def` for all endpoints
- Dependency injection with `Depends()` for database sessions, auth, shared logic
- Pydantic V2 models for all request/response schemas — never return raw dicts
- Use `lifespan` context manager for startup/shutdown (DB connections, ML model loading)
- Router organization: `src/api/routes/` with one router per domain
- Error handling: `HTTPException` for expected errors, exception handlers for unexpected
- Consistent error shape: `{ "error": str, "message": str, "details": dict }`
- Background tasks with `BackgroundTasks` for non-blocking operations

## PostgreSQL + SQLAlchemy

- SQLAlchemy 2.0 style — use `select()`, `insert()`, `update()`, `delete()` statements
- Async engine with `create_async_engine()` and `async_sessionmaker()`
- Connection string via `DATABASE_URL` env var
- Models in `src/models/` with one file per entity
- Use `mapped_column()` with explicit types — no implicit column inference
- Index every column used in WHERE, JOIN, or ORDER BY
- Relationship loading: use `selectinload()` for collections, `joinedload()` for single relations
- Session management: request-scoped sessions via `Depends(get_db)`

## Alembic Migrations

- Config in `alembic.ini`, env in `alembic/env.py`
- Development: `alembic revision --autogenerate -m "description"`
- Production: manually reviewed migrations, never autogenerate blindly
- Always test migrations both up and down (rollback)
- One migration per logical change — don't batch unrelated schema changes

## PyTorch / ML

- Models in `src/models/ml/` — separate from SQLAlchemy ORM models
- Training scripts in `src/training/`
- Inference endpoints load models at startup via lifespan, not per-request
- Reproducibility: set seeds (`torch.manual_seed`, `numpy.random.seed`), log hyperparameters
- Model versioning: save checkpoints with metadata (epoch, metrics, config)
- Data pipelines in `src/pipelines/` — pandas for ETL, torch DataLoaders for training

## pandas / Data Processing

- Use `pandas` for data loading, cleaning, transformation
- Prefer vectorized operations over iterrows — never loop over DataFrame rows
- Type hints with `pd.DataFrame` and column schemas documented
- For large datasets: chunked reading with `chunksize`, or use `polars` for performance-critical paths
- CSV/Parquet I/O: explicit dtypes on read, compression on write

## Testing (pytest)

- Test structure mirrors source: `tests/api/`, `tests/models/`, `tests/pipelines/`
- Use `httpx.AsyncClient` with `ASGITransport` for API tests
- Fixtures in `conftest.py` for database sessions, test client, sample data
- Use `pytest-asyncio` for async test support
- Factory fixtures for test data — never hard-code test objects across files
- ML tests: test model forward pass shapes, loss convergence on tiny datasets

## Project Structure

```
src/
├── api/
│   ├── routes/          # FastAPI routers (one per domain)
│   ├── deps.py          # Shared dependencies (get_db, get_current_user)
│   └── middleware.py     # CORS, auth, logging middleware
├── models/
│   ├── db/              # SQLAlchemy ORM models
│   └── ml/              # PyTorch model definitions
├── schemas/             # Pydantic request/response schemas
├── pipelines/           # Data processing pipelines
├── training/            # ML training scripts
├── services/            # Business logic layer
├── config.py            # Settings via pydantic-settings
└── main.py              # FastAPI app factory
alembic/                 # Database migrations
tests/                   # Mirror of src/ structure
```
