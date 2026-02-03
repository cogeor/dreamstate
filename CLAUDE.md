# CLAUDE.md

Guidance for Claude Code working with this repository.

## Delegate

Delegate is a Claude Code plugin with a background daemon for spec-driven development.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Development

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run daemon       # Start daemon (dev)
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

**Hooks** (configured via `.claude-plugin/plugin.json` -> `hooks/hooks.json`):
- `SessionStart`: Auto-starts daemon
- `UserPromptSubmit`: Processes daemon requests (e.g., auto-plan when idle)
- `SessionEnd`: Cleans up daemon on exit

## Project Structure

```
src/
├── daemon/          # Background daemon (file watcher, IPC, providers)
├── hooks/           # Hook implementations (session-start, prompt-submit, session-end)
├── shared/          # Shared types and config
└── utils/           # Utilities

commands/dg/         # Slash commands
agents/              # Agent definitions
hooks/               # Hook configuration (hooks.json)
bin/                 # CLI scripts
```
