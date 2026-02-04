# Architecture

## Overview

Delegate is a coding-agent plugin for spec-driven development. It provides slash commands and specialized agents that work within the agent's session. No background processes.

## Components

### Commands (`commands/dg/`)

| Command | Purpose |
|---------|---------|
| `/dg:study` | Explore codebase, propose implementation loops |
| `/dg:do` | Implement loops (plan, execute, test, commit) |
| `/dg:init` | Initialize delegate in a project |

### Agents (`agents/`)

| Agent | Role |
|-------|------|
| dg-study-planner | Executes one exploration iteration per study cycle |
| dg-planner | Creates detailed implementation plans from drafts |
| dg-executor | Implements a single task from a plan |
| dg-tester | Verifies implementation against plan, runs tests |
| dg-doc-generator | Generates documentation for source files |

### Shared (`src/shared/`)

- `config.ts` -- Configuration management and directory helpers
- `types.ts` -- TypeScript type definitions
- `state.ts` -- Project state management (STATE.md)

## File Structure

```
commands/dg/         # Slash commands (study, do, init)
agents/              # Agent definitions
src/shared/          # Shared types, config, state management
bin/                 # Installer scripts
.claude-plugin/      # Plugin manifest
```

## State Directory (`.delegate/`)

```
.delegate/
├── config.json      # Project configuration
├── plan.state       # Current study mode state
├── STATE.md         # Project state (focus, activity, next steps)
├── loops/           # Completed loop implementations
├── loop_plans/      # Study-generated loop plans and drafts
├── templates/       # Loop templates
└── docs/            # Generated documentation
```

## Workflow

1. **Study** (`/dg:study`) -- Explores codebase in 5-phase cycles [T]emplate, [I]ntrospect, [R]esearch, [F]lect, [V]erify. Produces loop drafts with acceptance criteria.
2. **Do** (`/dg:do`) -- Implements loops through plan-execute-test-commit pipeline. Each loop results in exactly one commit.

## Design Principles

- **Commands-only** -- No background processes. Everything runs within the agent session.
- **Provider-agnostic** -- Works with any coding agent (Claude Code, Codex, others).
- **Loop-based** -- Every change is a loop: plan, implement, test, commit.
- **Timestamp everything** -- Loop folders use YYYYMMDD-HHMMSS-slug naming.
- **File-based state** -- All state in `.delegate/` as readable files.
