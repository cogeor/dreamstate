# CLAUDE.md

Guidance for Claude Code working with this repository.

## Dreamstate

Dreamstate is a Claude Code plugin with a background daemon for spec-driven development.
Inspired by get-shit-done but with a simplified workflow and reactive file-watching.

**Core philosophy:** Humans write plan drafts, agents write self-cleaning code.

For system architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).
For loop workflow and commit process, see [WORKFLOW.md](WORKFLOW.md).

## Quick Reference

**NPM Scripts:**
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run daemon       # Start daemon (dev)
npm run install:claude  # Install plugin to Claude Code
```

**Plugin Commands:**
| Command | Purpose |
|---------|---------|
| `/ds:ping` | Test daemon connectivity |
| `/ds:status` | Show daemon and dream status |
| `/ds:dream [model]` | Enter dream mode (haiku/sonnet/opus) |
| `/ds:wake` | Stop dream mode |
| `/ds:loop [path]` | Start plan/implement/test loop |
| `/ds:verify-loop [id]` | Complete loop reflection |

**Agents:**
| Name | Role |
|------|------|
| `ds-coordinator` | Orchestrates loops |
| `ds-planner` | Creates implementation plans |
| `ds-executor` | Implements tasks |
| `ds-tester` | Verifies implementation |
| `ds-dream-planner` | Explores and plans during dream mode |
| `ds-doc-generator` | Generates documentation during dream mode |

## Plugin Development

**Commands** (`commands/{namespace}/*.md`):
```yaml
---
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

**Hooks** (configure in `settings.json`):
```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node path/to/hook.js" }] }
    ]
  }
}
```

## Configuration

`.dreamstate/config.json`:
```json
{
  "daemon": {
    "dream_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "model": "haiku",
    "auto_dream": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10,
      "prompt": null
    }
  },
  "watch": {
    "patterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "ignore": ["node_modules", "dist", ".git", ".dreamstate"]
  },
  "docs": {
    "enabled": true,
    "patterns": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/*.test.ts", "**/*.spec.ts", "**/types.ts"]
  }
}
```

**Config Options:**
| Section | Option | Description |
|---------|--------|-------------|
| `daemon.auto_dream` | Auto-start dream mode when Claude Code is inactive |
| `daemon.auto_dream.max_iterations` | Limit iterations per dream session (prevents context bloat) |
| `docs` | Background documentation generation settings |
| `docs.patterns` | Files to generate docs for |
