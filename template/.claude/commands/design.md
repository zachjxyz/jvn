---
description: Create the technical plan for your feature
argument-hint: "[feature-name]"
---

# /design — Create the Technical Plan

You are orchestrating the planning phase. Follow these steps exactly.

## User Input

```text
$ARGUMENTS
```

If no feature name is provided, detect the current feature from the git branch name or the most recent `specs/` directory.

## Step 1: Generate Base Plan via Spec-Kit

Use the Skill tool to invoke the speckit-plan skill:

```
Skill(skill: "speckit-plan")
```

This generates:
- `specs/{feature}/plan.md` — core implementation plan
- `specs/{feature}/data-model.md` — database schema
- `specs/{feature}/contracts/` — API contracts
- Runs `update-agent-context.sh` to sync project context

Wait for completion.

## Step 2: Architectural Review

Use the Task tool to invoke the architect agent:

```
Task(subagent_type: "architect",
     description: "Architectural review of plan",
     prompt: "Review the plan at specs/{feature}/plan.md and the spec at specs/{feature}/spec.md.
     Evaluate:
     - Component architecture and boundaries
     - Data model design against Neon Postgres patterns
     - API contracts and interface design
     - Technology choices against the stack (Next.js App Router + Neon + Drizzle + Better Auth + Tailwind)
     - Scalability, security, and maintainability risks
     Append an '## Architectural Review' section to plan.md with your findings.")
```

## Step 3: Constitutional Validation

Use the Task tool to invoke the constitutional-validator agent:

```
Task(subagent_type: "constitutional-validator",
     description: "Validate plan against constitution",
     prompt: "Validate the plan at specs/{feature}/plan.md against the project constitution at .specify/memory/constitution.md.
     Check all dimensions: mission alignment, architectural alignment, complexity appropriateness, quality standards.
     Append a '## Constitutional Review' section to plan.md with your verdict and findings.")
```

**GATE**: If the verdict is **REJECTED** or **NEEDS REVISION**, STOP. Present the issues to the user. Do NOT proceed to task generation.

## Step 4: Generate Task Breakdown

Only if constitutional validation passed (APPROVED or APPROVED WITH CONDITIONS):

```
Skill(skill: "speckit-tasks")
```

This generates `specs/{feature}/tasks.md` with dependency-ordered tasks.

## Step 5: Present Summary

Present to the user:
- Plan summary (architecture, data model, key decisions)
- Architectural review highlights
- Constitutional validation verdict
- Number of phases and tasks generated

Suggest next step: `/build` to start implementation.

Prompt for `/compact` — this was a context-heavy workflow.

## Critical Rules

1. **Use Skill tool** for spec-kit skills, **Task tool** for agents
2. **Sequential execution** — each step depends on the previous
3. **Constitutional gate is mandatory** — never skip step 3
4. If the validator says NEEDS REVISION, work with the user to fix the plan before generating tasks
