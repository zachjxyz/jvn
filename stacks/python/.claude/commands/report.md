---
description: Analyze this project and generate a timestamped report
---

# /report — Project Analysis Report

Generate a comprehensive analysis of this project. Write the report to a timestamped markdown file.

## Process

### 1. Scan the Project

Read and analyze:
- `pyproject.toml` or `requirements.txt` — dependencies, versions, scripts
- `CLAUDE.md` — project instructions and stack declaration
- `.specify/memory/constitution.md` — project principles (if exists)
- `specs/` — feature specifications and plans (if any exist)
- `src/` directory — modules, routes, models, pipelines
- `alembic/` — database migrations and schema history
- `src/models/db/` or `src/schemas/` — data model definitions
- `tests/` — test files, coverage, and patterns
- `.env.example` or `.env.local` — environment variables (never read actual .env)
- `Dockerfile` or deployment configs — if present

### 2. Generate Report

Create a report with these sections:

#### Executive Summary
2-3 sentences: what this project is, its current state (early/active/mature), and overall health assessment.

#### Tech Stack

| Package | Version | Purpose | Status |
|---------|---------|---------|--------|
| fastapi | 0.x | API framework | Current |
| sqlalchemy | 2.x | Database ORM | Current |
| pytorch | 2.x | ML framework | Current |
| ... | ... | ... | ... |

Status: `Current` / `Outdated` / `Deprecated` / `Unknown`

Check actual installed versions from `pyproject.toml` or `requirements.txt`, not assumptions.

#### API Endpoints

| Route | Purpose | Auth Required | Method |
|-------|---------|---------------|--------|
| / | Health check | No | GET |
| /api/v1/predict | Model inference | Yes | POST |
| /api/v1/data | Data ingestion | Yes | POST |
| ... | ... | ... | ... |

Scan the `src/api/routes/` directory structure to find all endpoints. Note which ones require authentication.

#### Data & ML Overview

- **Database models**: List SQLAlchemy models and their relationships
- **ML models**: List model definitions, input/output shapes, serving endpoints
- **Pipelines**: Data processing and training pipelines
- **Migrations**: Number of migrations, latest migration description

#### SWOT Analysis

**Strengths** — What the project does well:
- Good patterns, clean architecture, test coverage, type safety, etc.
- Be specific — cite files and patterns.

**Weaknesses** — Internal issues to address:
- Missing tests, tech debt, unclear naming, missing error handling, no input validation
- Missing type hints, mypy violations, untested edge cases
- Rate each: Critical / High / Medium / Low

**Opportunities** — Improvements that would add value:
- Performance optimizations, model improvements, better data validation
- Estimate effort: Quick win / Medium / Large

**Threats** — External risks:
- Outdated dependencies with known vulnerabilities
- Scaling bottlenecks (inference latency, data pipeline throughput)
- Security gaps (input validation, auth, secrets management)
- Breaking changes in upcoming dependency versions

### 3. Write the Report

Generate a timestamp in MMDDyy-HHmmss format (e.g., 030626-141500 for March 6, 2026 at 2:15 PM).

Write the report to: `reports/report-{timestamp}.md`

Create the `reports/` directory if it doesn't exist.

### 4. Present Results

Tell the user:
- Where the report was written
- Top 3 most critical findings
- Suggest: `jvn --report-fix @latest` to address the findings
