---
name: dg:init
description: Initialize delegate in current project (user)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

# /dg:init - Initialize Delegate

Create the `.delegate/` directory structure and update project files. This command is idempotent — safe to run multiple times. Never overwrite existing config.

## Step 1: Create directories

```bash
mkdir -p .delegate/loops .delegate/loop_plans
```

## Step 2: Create config.json (if missing)

Check if `.delegate/config.json` exists. If not, create:

```json
{
  "docs": {
    "enabled": true,
    "patterns": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/*.test.ts", "**/*.spec.ts", "**/types.ts"]
  }
}
```

If config.json already exists, do NOT overwrite it.

## Step 3: Update .gitignore

If `.gitignore` doesn't contain `.delegate/`, append:
```
# Delegate runtime files
.delegate/
```

If no `.gitignore` exists, create one with this content.

## Step 4: Update AGENTS.md

If `AGENTS.md` doesn't contain a `## Delegate` section, append:

```markdown

## Delegate

This project uses the Delegate plugin for spec-driven development.

**A loop is a focused unit of work that results in exactly one commit.** Each loop has a draft describing what to do, acceptance tests for verification, and a clear scope. Loops are the fundamental unit — everything in delegate either creates loops or implements them.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/dg:study [model] [theme]` | Study the codebase, propose loops |
| `/dg:do [args]` | Implement one or more loops |

**Workflow:**
1. `/dg:study` — explores codebase, web, tests; produces loop drafts with acceptance criteria
2. `/dg:do plan` — review proposed loops
3. `/dg:do 02` or `/dg:do add logout button` — implement loops (plan, execute, test, commit each)

Loop drafts live in `.delegate/loop_plans/`. Each draft includes acceptance tests that `/dg:do` uses to verify the implementation before committing.
```

If no `AGENTS.md` exists, create one with a `# AGENTS.md` header and the above content.

## Step 5: Report

```
Delegate Initialized
  .delegate/     {created|exists}
  config.json    {created|exists}
  .gitignore     {updated|already has .delegate/}
  AGENTS.md      {updated|already has delegate section}

Next: /dg:study to explore, /dg:do to implement
```
