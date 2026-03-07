# Project Constitution

> This file defines the principles that govern all development in this project.
> The constitutional-validator agent enforces these during `/design`.
> Edit freely — this is YOUR project's constitution.

## Stack Principles

- **Next.js App Router** — Server Components by default. Only add `"use client"` when interactivity, browser APIs, or hooks are needed. Server actions for mutations, route handlers for webhooks.
- **Neon Postgres** — Serverless Postgres via `@neondatabase/serverless`. Use pooled connections in serverless environments. Use Neon branching for preview deployments.
- **Drizzle ORM** — All database access through Drizzle. No raw SQL in application code. Index every column used in WHERE, JOIN, or ORDER BY.
- **Better Auth** — Drizzle adapter pointing at Neon. Re-run `npx @better-auth/cli@latest generate` after any plugin change. Infer types with `$Infer`.
- **Tailwind CSS** — Utility-first. No custom CSS unless absolutely necessary.
- **Vercel** — Deployment target. Optimize for serverless and edge where appropriate.

## Engineering Principles

- **Test-Driven Development** — Write the test first. Watch it fail. Write minimal code to pass. Refactor. No exceptions without explicit human approval.
- **Simplicity over cleverness** — No over-engineering. No premature abstractions. Three similar lines are better than one clever abstraction.
- **TypeScript strict** — No `any`. No `@ts-ignore`. Define named types for complex shapes.
- **One responsibility per file** — Split at ~200 lines.
- **Early returns** — Guard against invalid states at the top. Avoid deep nesting.
- **No dead code** — Remove unused imports, variables, and functions immediately.
- **Test at boundaries** — Validate user input and external APIs. Trust internal code and framework guarantees.

## AI Collaboration Principles

- **Specs before code** — Always `/spec` before `/build`. Understand what you're building before building it.
- **Human approves at gates** — AI proposes, human decides. Every implementation phase requires explicit user approval.
- **Constitutional compliance** — The validator agent checks plans against this document. Violations block implementation.
- **Commit often** — At least once per completed task. Small, reversible commits.
- **Context hygiene** — Run `/compact` after heavy workflows. Start fresh sessions for unrelated tasks.

## Quality Gates

Before any phase is considered complete:

- [ ] All deliverables implemented
- [ ] Tests pass (unit + integration)
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Code review approved
- [ ] User validation received

## Stack Override

<!-- Uncomment and modify to change the default stack for this project:
- Database: Supabase Postgres (replace Neon references above)
- Auth: Clerk @clerk/nextjs (replace Better Auth references above)
- Styling: CSS Modules (replace Tailwind references above)
-->
