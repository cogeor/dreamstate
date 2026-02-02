---
name: ds:init
description: Initialize dreamstate in current project by updating CLAUDE.md
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

<objective>
Initialize dreamstate in the current project by appending dreamstate-specific instructions to the project's CLAUDE.md file.
</objective>

<instructions>
1. Check if CLAUDE.md exists in the project root
2. If CLAUDE.md exists, check if it already contains "## Dreamstate Plugin"
3. If already initialized, inform the user
4. If not initialized, append the dreamstate instructions
5. If no CLAUDE.md exists, create one with a minimal header plus dreamstate instructions
</instructions>

<dreamstate-content>
The following content should be appended to CLAUDE.md:

```markdown

## Dreamstate Plugin

This project uses the Dreamstate plugin for spec-driven development.

**Commands:**
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

**Configuration** (`.dreamstate/config.json`):
```json
{
  "daemon": {
    "provider": "claude",
    "model": "haiku",
    "dream_timeout_minutes": 5,
    "token_budget_per_hour": 10000,
    "auto_dream": {
      "enabled": false,
      "model": "haiku",
      "max_iterations": 10
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
```
</dreamstate-content>

<execution>
1. Use Glob to check for CLAUDE.md in the project root
2. If found, use Read to check contents for "## Dreamstate Plugin"
3. If already present: report "Dreamstate already initialized in CLAUDE.md"
4. If not present: use Edit to append the dreamstate content to the end of the file
5. If CLAUDE.md doesn't exist: use Write to create it with:
   ```markdown
   # CLAUDE.md

   Project instructions for Claude Code.

   ## Dreamstate Plugin
   ... (rest of content)
   ```
</execution>

<output-format>
On success (appended):
```
✓ Dreamstate initialized!
  Updated: CLAUDE.md

  Run /ds:ping to test the daemon connection.
```

On success (created):
```
✓ Dreamstate initialized!
  Created: CLAUDE.md

  Run /ds:ping to test the daemon connection.
```

Already initialized:
```
ℹ Dreamstate already initialized in CLAUDE.md
```
</output-format>
