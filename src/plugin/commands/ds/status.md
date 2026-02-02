---
name: ds:status
description: Show dreamstate daemon and dream mode status
allowed-tools:
  - Read
---

<objective>
Display the current status of the dreamstate daemon and dream mode.
</objective>

<instructions>
1. Read `.dreamstate/daemon.status` for daemon state
2. Read `.dreamstate/dream.state` for dream mode state
3. Display formatted status information
</instructions>

<execution>
1. Read `.dreamstate/daemon.status` and parse as JSON
   - Check if `lastActivity` is within last 10 seconds
   - If stale, daemon is stopped

2. Read `.dreamstate/dream.state` and parse as JSON
   - Check if `active` is true
   - Show iteration count and current loop plan

3. Count loop reflections:
   - Glob for `.dreamstate/loops/*/STATUS.md`
   - For each, check if phase is "complete"
   - Check if REFLECTION.md exists and Status is not "PENDING"
   - Calculate: reflected / total completed
</execution>

<output-format>
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon:     {Running|Stopped}
PID:        {pid}
Uptime:     {formatted uptime}
Tasks:      {tasksProcessed} processed

Token Budget:
  Used:     {used}/{limit} tokens this hour
  Status:   {Active|Paused}
  Resets:   {minutes until reset}

Dream Mode: {Active|Inactive}
Model:      {model if active}
Focus:      {prompt if provided, else "General exploration"}
Iterations: {count if active}
Loop Plan:  {path if active}

Loops:
  Completed:  {total_complete}
  Reflected:  {reflected}/{total_complete}
  Pending:    /ds:verify-loop to complete reflections

Watching:   {patterns}

Commands:
  /ds:dream [model] [prompt]  - Enter dream mode with optional focus
  /ds:wake                    - Stop dream mode
  /ds:loop                    - Run a loop
```

When daemon not running:
```
Dreamstate Status
━━━━━━━━━━━━━━━━━

Daemon: Not running

Start with: npm run daemon
```

When token budget paused:
```
Token Budget: PAUSED
  Used: {used}/{limit} tokens
  Operations paused until budget resets
  Manual resume: Update config or wait for hourly reset
```
</output-format>
