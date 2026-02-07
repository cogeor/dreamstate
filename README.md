# Delegate

A coding-agent plugin that splits work into two phases: **study** (explore and propose) and **work** (implement and commit).

## Example

```
# 1. Study with a theme
/dg:study auth

# Creates: .delegate/study/20240115-143022-auth/
#   ├── S.md, I.md, T.md (optional)
#   └── TASK.md (always)

# 2. Implement the TASK
/dg:work 20240115-143022-auth

# Creates: .delegate/work/20240115-143030-auth/
#   ├── TASK.md
#   ├── LOOPS.yaml
#   ├── 01/PLAN.md, IMPLEMENTATION.md, TEST.md
#   └── (commits after each loop)

# 3. Or implement directly from prompt
/dg:work add --help flag
```

## Install

**Prerequisites:** Node.js 18+, Claude Code CLI

```bash
git clone <repo-url> && cd delegate
npm install

# Install to Claude Code
npx delegate-claude install

# Restart Claude Code, then initialize in your project
/dg:init
```

### Uninstall

```bash
npx delegate-claude uninstall
```

## Commands

| Command | Purpose |
|---------|---------|
| `/dg:study [model] [theme]` | SITR cycles → TASKs |
| `/dg:work {stump}` | Execute TASK → loops → commits |
| `/dg:work plan {prompt}` | Plan only, no execute |
| `/dg:work {prompt}` | Plan + execute from prompt |
| `/dg:init` | Initialize delegate in project |

## How It Works

```
/dg:study                    /dg:work {stump}
    │                              │
    ▼                              ▼
[S] Search (optional)        Read TASK.md
[I] Introspect (optional)         │
[T] Template (optional)           ▼
[R] Review (always)          work-planner → LOOPS.yaml
    │                              │
    ▼                         ┌────┴────┐
.delegate/study/{stump}/      │  Loop   │
└── TASK.md                   │  01/    │
                              ├─────────┤
                              │ PLAN.md │
                              │ IMPL.md │
                              │ TEST.md │
                              └────┬────┘
                                   │
                              git commit
```

## Output Structure

```
.delegate/
├── study/             # SITR cycle outputs
├── work/              # Task execution
├── templates/         # Cloned repos
└── doc/               # Auto-generated docs
```

## License

MIT
