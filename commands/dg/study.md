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

# /dg:study - Multi-Cycle Study Mode

You are the ORCHESTRATOR. You run up to N SITR cycles, each producing a TASK in `.delegate/study/`.

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

| Command | Model | Cycles | Theme |
|---------|-------|--------|-------|
| `/dg:study` | haiku | 5 | null |
| `/dg:study 10` | haiku | 10 | null |
| `/dg:study opus` | opus | 5 | null |
| `/dg:study opus 3` | opus | 3 | null |
| `/dg:study sonnet 10 auth` | sonnet | 10 | "auth" |
| `/dg:study 5 improve error handling` | haiku | 5 | "improve error handling" |

**Parsing order:** `[model] [cycles] [theme...]`
- `haiku`, `opus`, `sonnet` → model (default: haiku)
- Number → cycle count (default: 5)
- Remaining words → theme

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

## Multi-Cycle Execution

Run up to N cycles (default 5):

```
for cycle in 1..N:
    1. Create new stump folder
    2. Run SITR phases
    3. Report cycle result
    4. If interrupted → stop
```

**After all cycles:**
```
Study complete: {N} cycles
├── {stump-1}: {task-title}
├── {stump-2}: {task-title}
└── ...

Run /dg:work {stump} on any task.
```
