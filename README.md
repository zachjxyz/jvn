# jvn

Spec-driven development with Claude Code.

Named after **John von Neumann** — the man who wrote the spec that defined computing.

## Quick Start

```bash
cd my-project
npx jvn
```

That's it. Then:

```bash
claude
/spec "what you want to build"
```

## What it does

`jvn` sets up spec-driven development in any project:

1. Installs 18 curated skills globally (Neon, React, Better Auth, TDD, and more)
2. Initializes [GitHub Spec-Kit](https://github.com/github/spec-kit) with Claude Code integration
3. Pre-configures a project constitution with engineering best practices
4. Adds 5 specialized agents and 5 workflow commands

## Commands

After setup, open `claude` and use:

| Command | What it does |
|---------|-------------|
| `/spec "feature"` | Describe what you want to build. Creates a rich specification with product, UX, and technical considerations. |
| `/design` | Create the technical plan. Architecture review and constitutional validation included. |
| `/build` | Build it phase by phase. TDD enforced, tests run, code reviewed, your approval required at every gate. |
| `/report` | Analyze the project — tech stack, routes, SWOT analysis. Generates a timestamped report. |
| `/report-fix @latest` | Systematically fix issues from the most recent report. |

Flow: `/spec` → `/design` → `/build`

## CLI Flags

```bash
jvn                              # Set up spec-driven dev
jvn --dry-run                    # Preview what would happen
jvn --force                      # Overwrite existing files
jvn --skip-skills                # Skip skill installation
jvn --skip-speckit               # Skip Spec-Kit init
jvn --report                     # Generate project report
jvn --report-fix @latest         # Fix issues from latest report
jvn --report-fix report-030626   # Fix issues from specific report
jvn --version                    # Print version
jvn --help                       # Print help
```

## What Gets Installed

### Skills (18)

| Skill | Source | Category |
|-------|--------|----------|
| Neon Postgres | neondatabase/agent-skills | Database |
| Better Auth | better-auth/skills | Auth |
| React Best Practices | vercel-labs/agent-skills | Frontend |
| Composition Patterns | vercel-labs/agent-skills | Frontend |
| Frontend Design | anthropics/skills | Design |
| Web Design Guidelines | vercel-labs/agent-skills | Design |
| API Design | wshobson/agents | API |
| Webapp Testing | anthropics/skills | Testing |
| Test-Driven Development | obra/superpowers | Testing |
| Dogfood QA | vercel-labs/agent-browser | QA |
| MCP Builder | anthropics/skills | Tools |
| Doc Coauthoring | anthropics/skills | Docs |
| PDF | anthropics/skills | Docs |
| DOCX | anthropics/skills | Docs |
| Resend Email | resend/resend-skills | Email |
| Skill Creator | anthropics/skills | Meta |
| Find Skills | vercel-labs/skills | Meta |
| Git Commit | github/awesome-copilot | Git |

### Agents (5)

| Agent | Model | Role |
|-------|-------|------|
| architect | opus | System design, data modeling, API contracts |
| product-manager | sonnet | User stories, acceptance criteria, scope |
| ux-designer | sonnet | User flows, states, accessibility |
| code-reviewer | sonnet | Correctness, TDD enforcement, security |
| constitutional-validator | opus | Constitution compliance gate |

## Architecture

```
/spec → /design → /build
  │        │         │
  │        │         ├── speckit-implement (code generation, TDD)
  │        │         ├── webapp-testing (Playwright validation)
  │        │         ├── code-reviewer agent (TDD + checklist)
  │        │         ├── user validation gate (your approval)
  │        │         └── dogfood (final QA exploration)
  │        │
  │        ├── speckit-plan (base plan)
  │        ├── architect agent (review)
  │        ├── constitutional-validator agent (gate)
  │        └── speckit-tasks (task breakdown)
  │
  ├── speckit-specify (base spec)
  ├── product-manager agent (enrichment)
  └── ux-designer agent (UX brief)
```

## Default Stack

- **Next.js** (App Router) on Vercel
- **Neon Postgres** via Drizzle ORM
- **Better Auth** with Drizzle adapter
- **Tailwind CSS**

The constitution and stack knowledge are pre-configured for this stack. To customize:

1. Edit `CLAUDE.md` — uncomment the Stack Override section
2. Edit `.specify/memory/constitution.md` — update Stack Principles
3. Edit `.claude/skills/stack-knowledge/SKILL.md` — update patterns

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Claude Code](https://claude.ai/code)
- [GitHub Spec-Kit](https://github.com/github/spec-kit) (`pipx install specify-cli`)

## License

MIT
