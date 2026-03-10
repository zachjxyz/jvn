---
description: Describe what you want to build
argument-hint: "<what you want to build>"
---

# /spec — Create a Feature Specification

You are orchestrating the specification phase. Follow these steps exactly.

## User Input

```text
$ARGUMENTS
```

## Step 1: Create Feature via Spec-Kit

Use the Skill tool to invoke the speckit-specify skill:

```
Skill(skill: "speckit-specify", args: "$ARGUMENTS")
```

This creates:
- A feature branch (NNN-short-name)
- A `specs/NNN-short-name/` directory
- A base `spec.md` from spec-kit's template

Wait for completion. Note the spec path from the output.

## Step 2: Enrich with Product Manager

Use the Task tool to invoke the product-manager agent:

```
Task(subagent_type: "product-manager",
     description: "Enrich feature specification",
     prompt: "Read the specification at specs/{feature}/spec.md. Enhance it with:
     - Deeper user stories with acceptance criteria
     - Non-functional requirements (performance, security, scalability)
     - Clear scope boundaries (in scope / out of scope)
     - Success criteria (measurable, technology-agnostic)
     - Risks and open questions
     If .specify/memory/constitution.md exists, validate feature alignment.
     Write the enriched content back to the same file.")
```

## Step 3: Add Data Considerations

Use the Task tool to invoke the data-analyst agent:

```
Task(subagent_type: "data-analyst",
     description: "Add data brief to specification",
     prompt: "Read the specification at specs/{feature}/spec.md. Append a Data Brief section covering:
     - Data sources and formats
     - Pipeline design (ETL/processing steps)
     - Model I/O schemas (input features, output format, confidence)
     - Validation strategy (data quality checks, schema validation)
     - Error handling and fallback behavior
     - Performance considerations (batch vs streaming, caching)
     Append the Data Brief section to the same file.")
```

## Step 4: Present Summary

Present the enriched specification to the user:
- Show the spec path
- Highlight key user stories and requirements
- Note any `[NEEDS CLARIFICATION]` markers

Suggest next steps:
- `/speckit.clarify` if there are ambiguities to resolve
- `/design` to create the technical plan

## Critical Rules

1. **Use Skill tool** for speckit-specify (not Task, not bash)
2. **Use Task tool** for agents (not Skill, not bash)
3. **Sequential execution** — each step must complete before the next
4. If the speckit-specify skill fails, STOP and inform the user
