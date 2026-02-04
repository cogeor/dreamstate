# CLAUDE.md

Guidance for coding agents working with this repository.

## Delegate

Delegate is a coding-agent plugin for spec-driven development.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Development

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
```

## Plugin Development

**Commands** (`commands/{namespace}/*.md`):
```yaml
---
name: dg:command-name
description: What this command does
allowed-tools:
  - Read
  - Write
  - Task
---
Command prompt content
```

**Agents** (`agents/*.md`):
```yaml
---
name: agent-name
color: cyan
allowed-tools:
  - Read
  - Grep
  - Task
---
Agent system prompt
```

## Delegate

A loop is a focused unit of work that results in exactly one commit. Each loop has a draft describing what to do, acceptance tests for verification, and a clear scope. Loops are the fundamental unit — everything in delegate either creates loops or implements them.

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

## Project Structure

```
src/
└── shared/          # Shared types and config

commands/dg/         # Slash commands
agents/              # Agent definitions
bin/                 # CLI scripts
```
