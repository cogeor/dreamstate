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

<objective>
Initialize delegate in the current project by creating the `.delegate/` directory structure, config file, updating CLAUDE.md, and ensuring .gitignore excludes runtime files.
</objective>

<what-gets-created>
```
project/
├── CLAUDE.md              # Updated with delegate instructions
├── .gitignore             # Updated to exclude .delegate/
└── .delegate/
    ├── config.json        # Default configuration
    ├── tasks/             # IPC task queue (daemon)
    ├── results/           # IPC task results (daemon)
    ├── loops/             # Executed loop artifacts
    └── loop_plans/        # Plan proposals and plans
```
</what-gets-created>

<execution>
## Step 1: Create .delegate/ directory structure

Create the following directories using Bash:
```bash
mkdir -p .delegate/tasks .delegate/results .delegate/loops .delegate/loop_plans
```

## Step 2: Create config.json (if not exists)

Check if `.delegate/config.json` exists using Glob. If not, create it with default config using Write:

```json
{
  "daemon": {
    "provider": "claude",
    "model": "haiku",
    "plan_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "auto_plan": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".delegate"]
  },
  "docs": {
    "enabled": true,
    "patterns": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/*.test.ts", "**/*.spec.ts", "**/types.ts"]
  }
}
```

If config.json already exists, do NOT overwrite it.

## Step 3: Update .gitignore

Check if `.gitignore` exists and contains `.delegate/`:
1. Use Glob to check if .gitignore exists
2. If exists, use Read to check contents for `.delegate`
3. If .gitignore doesn't exist: use Write to create it with `.delegate/`
4. If .gitignore exists but doesn't have `.delegate/`: use Edit to append it
5. If already has `.delegate/`: skip

Content to add (if needed):
```
# Delegate runtime files
.delegate/
```

## Step 4: Update CLAUDE.md

Check if `CLAUDE.md` exists in project root:
1. Use Glob to check if CLAUDE.md exists
2. If exists, use Read to check for "## Delegate Plugin"
3. If exists and already has delegate section: skip
4. If exists but no delegate section: use Edit to append
5. If doesn't exist: use Write to create with header + content

### Delegate content to append to CLAUDE.md:

```markdown

## Delegate Plugin

This project uses the Delegate plugin for spec-driven development.

**Commands:**
| Command | Purpose |
|---------|---------|
| `/dg:status` | Show daemon and plan status (includes ping) |
| `/dg:plan [model] [theme]` | Enter plan mode (haiku/sonnet/opus) |
| `/dg:do [args]` | Start plan/implement/test loop |
| `/dg:init` | Initialize delegate in project |

**Agents:**
| Name | Role |
|------|------|
| `dg-planner` | Creates implementation plans |
| `dg-executor` | Implements tasks |
| `dg-tester` | Verifies implementation |
| `dg-plan-planner` | Explores and plans during plan mode |
| `dg-doc-generator` | Generates documentation during plan mode |

**Configuration** (`.delegate/config.json`):
- `daemon.model`: Default model for daemon tasks (haiku/sonnet/opus)
- `daemon.auto_plan.enabled`: Auto-start plan when idle (default: false)
- `daemon.token_budget_per_hour`: Hourly token limit (default: 10000)
- `watch.patterns`: File patterns to watch for changes
- `docs.enabled`: Enable documentation generation

**Directory Structure** (`.delegate/`):
- `config.json` - Configuration
- `loops/` - Executed loop artifacts
- `loop_plans/` - Plan proposals and implementation plans
- `tasks/`, `results/` - IPC with daemon (auto-managed)
```

### If CLAUDE.md doesn't exist, create with:

```markdown
# CLAUDE.md

Project instructions for Claude Code.

## Delegate Plugin

... (rest of content from above)
```
</execution>

<output-format>
On success (fresh install):
```
Delegate Initialized

Created .delegate/
  config.json
  tasks/
  results/
  loops/
  loop_plans/

Updated .gitignore
Updated CLAUDE.md

Next steps:
  1. Start daemon: npm run daemon (in delegate project)
  2. Check status: /dg:status
  3. Enter plan mode: /dg:plan
```

On success (already partially initialized):
```
Delegate Initialized

.delegate/ directory exists
config.json exists (preserved)
Updated .gitignore
Updated CLAUDE.md

Next steps:
  1. Check status: /dg:status
```

Already fully initialized:
```
Delegate already initialized

  .delegate/     exists
  config.json    exists
  .gitignore     has .delegate/
  CLAUDE.md      has delegate section

Run /dg:status to check daemon connection.
```
</output-format>

<idempotent>
This command is idempotent - safe to run multiple times:
- Directories: created only if missing
- config.json: created only if missing (never overwrites user config)
- .gitignore: line added only if missing
- CLAUDE.md: section added only if missing
</idempotent>
