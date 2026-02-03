# Module: src/daemon

## Overview

Background daemon that watches files, detects idle state, manages token budgets, and processes tasks via file-based IPC with the Claude Code plugin.

## Public API

- `Daemon` - Main daemon class with start/stop lifecycle
- `IPC` - File-based inter-process communication
- `FileWatcher` - Watches files for changes and @delegate directives
- `PlanDetector` - Tracks activity and triggers plan callbacks
- `TokenBudgetTracker` - Manages hourly token spending limits
- `runClaude` - Spawns claude CLI with prompts
- `runClaudeAgent` - Runs claude with a specific agent name

## Architecture

```
                      +-----------------+
                      |     Daemon      |
                      | (orchestrator)  |
                      +-------+---------+
                              |
          +-------------------+-------------------+
          |           |           |               |
    +-----+----+ +-----+-----+ +----+-----+ +------+------+
    |FileWatcher| |PlanDetector| |TokenBudget| |    IPC     |
    |(chokidar) | |(activity)  | |(limits)   | |(file-based)|
    +-----+-----+ +------+-----+ +-----+-----+ +------+-----+
          |              |              |              |
          v              v              v              v
    [file changes] [plan events]  [budget checks] [.delegate/]
```

## Key Files

| File | Purpose |
|------|---------|
| index.ts | Daemon entry point, orchestrates all components |
| ipc.ts | File-based IPC: status, tasks, results |
| file-watcher.ts | Watches files, scans for @delegate directives |
| plan-detector.ts | Tracks activity, triggers plan callbacks |
| token-budget.ts | Hourly token budget tracking and enforcement |
| claude-cli.ts | Spawns claude CLI processes |

## Dependencies

**Inputs:**
- `chokidar` - File watching
- `../shared/config` - Configuration loading
- `../shared/types` - Type definitions

**Outputs:**
- `.delegate/daemon.status` - Current daemon state
- `.delegate/daemon.pid` - Process ID file
- `.delegate/results/*.json` - Task results
