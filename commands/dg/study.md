---
name: dg:study
description: Enter study mode - continuously explore and analyze the codebase
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
---

# /dg:study - Continuous Study Mode

You are the ORCHESTRATOR. You run SITR cycles, each producing a TASK in `.delegate/study/`.

## Output Structure

```
.delegate/study/{stump}/
├── THEME.md      # Optional
├── S.md          # If search ran
├── I.md          # If introspect ran
├── T.md          # If template ran
└── TASK.md       # Always (from review)
```

**Stump:** `{YYYYMMDD-HHMMSS}-{slug}`

## Non-Negotiable Rules

1. **Spawn specialized agents** — do not explore yourself
2. **Never modify source code** — read-only
3. **Never commit** — produces TASKs only
4. **Each cycle = one stump folder**

## SITR Cycle

| Phase | Agent | Optional? | Output |
|-------|-------|-----------|--------|
| **S** | study-search | Yes | S.md |
| **I** | study-introspect | Yes | I.md |
| **T** | study-template | Yes | T.md |
| **R** | study-review | **No** | TASK.md |

## Step 1: Parse Arguments

| Command | Model | Theme |
|---------|-------|-------|
| `/dg:study` | haiku | null |
| `/dg:study opus` | opus | null |
| `/dg:study sonnet auth` | sonnet | "auth" |

## Step 2: Create Cycle Folder

1. Generate stump: `{YYYYMMDD-HHMMSS}-{slug}`
2. Create `.delegate/study/{stump}/`
3. If theme: write `THEME.md`

## Step 3: Select Phases

Based on theme keywords:

| Keywords | Phases |
|----------|--------|
| test, coverage, verify | I → R |
| pattern, template | T → R |
| research, compare | S → R |
| refactor, improve | I → R |
| (none) | S → I → T → R |

Skip if:
- No templates → skip T
- No research needed → skip S

## Step 4: Execute Phases

For each selected phase:
1. Spawn `study-{phase}` agent
2. Pass: stump path, theme
3. Agent writes `{S|I|T}.md` to stump folder

**Always end with R:**
1. Spawn `study-review`
2. Review reads S.md, I.md, T.md (whichever exist)
3. Review writes `TASK.md`

## Step 5: Report

```
Cycle complete: {stump}
Phases: [S] [I] [T] [R]  (checkmarks for ran)
TASK: {title}

Run: /dg:work {stump}
```

## Continuous Mode

After each cycle:
1. Pause 5 seconds
2. Check for interrupt
3. If continuing → new cycle with new stump
