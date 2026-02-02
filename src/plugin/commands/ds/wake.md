---
name: ds:wake
description: Stop dream mode and return control to human
allowed-tools:
  - Read
  - Write
---

<objective>
Stop the dream mode loop and return control to the human user.
</objective>

<execution>
1. Read .dreamstate/dream.state

2. If not in dream mode:
   ```
   Not in dream mode. Nothing to wake from.
   ```

3. If in dream mode:
   - Set active = false
   - Set stoppedAt = current timestamp
   - Write updated state to .dreamstate/dream.state

4. Report summary:
   ```
   Dream Mode Stopped
   ━━━━━━━━━━━━━━━━━━
   Duration: {time since startedAt}
   Iterations: {count}
   Model: {model}

   Loop Plan: {currentLoopPlan}

   Summary of work done:
   - {count} iterations completed
   - Types: [T]={t_count} [I]={i_count} [R]={r_count}

   To review: Read {currentLoopPlan}/ITERATIONS.md
   To continue dream: /ds:dream
   To run a loop: /ds:loop {path-to-loop-draft}
   ```
</execution>

<state-update>
Update .dreamstate/dream.state:
```json
{
  "active": false,
  "startedAt": "{original}",
  "stoppedAt": "{now}",
  "model": "{model}",
  "iterations": {final count},
  "currentLoopPlan": "{path}",
  "lastIteration": "{timestamp}",
  "tokensUsed": {estimate}
}
```
</state-update>
