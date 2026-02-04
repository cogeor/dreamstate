# Delegate

Spec-driven workflow orchestration for coding agents: it separates exploration (study) from implementation (do), then runs each loop through tests and commit hygiene.

## How It Works

**Study Mode** (`/dg:study`) - The coding agent continuously explores your codebase, analyzes patterns, runs tests, and proposes improvements. Plans are read-only: they can create tests but cannot modify source code.

**Do Mode** (`/dg:do`) - The coding agent implements changes from a prompt or plan. Full-cycle: plan, implement, test, commit.

Separate exploration from execution. Plans propose, do executes.

## Install

**Prerequisites:** Node.js 18+, one supported coding-agent CLI (Claude CLI or Codex CLI)

```bash
git clone <repo-url> && cd delegate
npm install && npm run build
# Codex
npx delegate-codex install
# Claude
npx delegate-claude install
```

If you prefer one CLI, `delegate-agent` requires an explicit target:

```bash
npx delegate-agent install codex
npx delegate-agent install claude
```

The installer supports both environments:
- `claude`: installs commands and agents into `~/.claude/`
- `codex`: installs the delegate skill into `~/.codex/skills/delegate`

Restart your coding agent, then initialize delegate in your project:

```
/dg:init
```

This creates `.delegate/`, adds config, updates `.gitignore`, and adds usage docs to your `AGENTS.md`.

### Uninstall

```bash
npx delegate-codex uninstall
npx delegate-claude uninstall
# or:
npx delegate-agent uninstall codex
npx delegate-agent uninstall claude
```

## Commands

```bash
/dg:study                   # Enter study mode (continuous exploration)
/dg:study sonnet testing     # Study with model and focus theme
/dg:do add dark mode       # Plan then implement from prompt
/dg:do plan                # Show all unimplemented loops
/dg:do 02                  # Execute specific loop from plan
/dg:init                   # Initialize delegate in a project
```

## Workflow

```
1. PLAN: Explore and analyze
   /dg:study user authentication
   -> Creates loop plan with proposals in .delegate/loop_plans/

2. REVIEW: Check what was proposed
   /dg:do plan
   -> Shows unimplemented loops

3. DO: Execute a loop
   /dg:do 02
   -> Plans, implements, tests, commits

4. REPEAT
```

## Architecture

```
Coding Agent Session
+------------------------------------------+
|  /dg:study           /dg:do              |
|      |                   |               |
|      v                   v               |
|  dg-study-planner    dg-planner          |
|                      dg-executor         |
|                      dg-tester           |
|      |                   |               |
|      v                   v               |
|  .delegate/                              |
|  +-- loop_plans/     loops/              |
|  +-- plan.state      config.json         |
+------------------------------------------+
```

### Components

**Commands** - Slash commands (`/dg:study`, `/dg:do`, `/dg:init`) for user interaction

**Agents** - Specialized agents (dg-planner, dg-executor, dg-tester, dg-study-planner, dg-doc-generator)

**Shared** - Types, config, state management

## Development

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm test             # Run tests
```

## License

MIT
