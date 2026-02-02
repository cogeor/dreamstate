---
name: ds:dream
description: Enter dream mode - continuously explore and refine until /ds:wake
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  - Bash
  - WebSearch
---

<objective>
Enter dream mode with a specified model. Continuously iterate on exploration, code analysis, and external research until stopped with /ds:wake.
</objective>

<usage>
/ds:dream [model] [prompt]

Arguments:
  model  - haiku (default), sonnet, or opus
  prompt - Optional guidance for the dream planner

Examples:
  /ds:dream
  /ds:dream haiku
  /ds:dream sonnet "focus on improving test coverage"
  /ds:dream "explore patterns in templates/"
  /ds:dream opus "analyze the daemon architecture"

If first argument is not a model name, it's treated as the prompt (uses haiku).
</usage>

<behavior>
Dream mode is a CONTINUOUS process that keeps running until /ds:wake is called.

Each iteration selects a dream TYPE and executes that exploration:
- [T] Template - explore .dreamstate/templates/ for patterns
- [I] Introspect - analyze src/ code for improvements
- [R] Research - search web for external patterns

The human can check progress anytime with /ds:status.
To stop: /ds:wake
</behavior>

<dream-types>
## Dream Type Selection

Each iteration deterministically selects ONE type based on iteration number:
- Iteration 1, 4, 7, 10... → [T] Template
- Iteration 2, 5, 8, 11... → [I] Introspect
- Iteration 3, 6, 9, 12... → [R] Research

### Type [T] - Template Exploration
- Read 1-2 files from .dreamstate/templates/
- Extract patterns applicable to this project
- Compare to existing implementation
- Output insight references template file

### Type [I] - Code Introspection
- Read 2-3 source files from src/
- Look for: duplication, missing error handling, inconsistent patterns
- Look for: opportunities for abstraction, dead code, TODO comments
- Suggest concrete improvements
- MAY read .arch/*.md for context

### Type [R] - External Research
- Use WebSearch (max 1 query, 3 results)
- Search for: best practices, libraries, patterns relevant to focus
- Extract actionable insights from results
- Note: WebSearch limited to 1 per iteration
</dream-types>

<execution>
1. Parse arguments:
   ```
   IF no arguments:
     model = "haiku", prompt = null
   ELSE IF first arg is "haiku"|"sonnet"|"opus":
     model = first arg
     prompt = remaining args joined (or null)
   ELSE:
     model = "haiku"
     prompt = all args joined
   ```

2. Check if already in dream mode:
   - Read .dreamstate/dream.state
   - If active, report "Already in dream mode. Use /ds:wake to stop."

3. Create or continue loop plan:
   - If no active plan, create new: .dreamstate/loop_plans/{timestamp}-dream-session/
   - If resuming, use existing plan

4. Initialize dream state:
   ```json
   {
     "active": true,
     "startedAt": "{timestamp}",
     "model": "{model}",
     "prompt": "{prompt or null}",
     "iterations": 0,
     "currentLoopPlan": "{path}",
     "lastIteration": null,
     "tokensUsed": 0,
     "session_summaries": []
   }
   ```
   Write to .dreamstate/dream.state

   **Note**: Preserve existing `session_summaries` from previous dream.state if present.

5. If prompt provided, write to {loop_plan}/FOCUS.md:
   ```markdown
   # Dream Session Focus

   > User-provided direction for this dream session.

   {prompt}

   ---
   Started: {timestamp}
   Model: {model}
   ```

6. Start iteration loop:
   ```
   max_iterations = config.daemon.auto_dream.max_iterations
   # Find config value: grep "max_iterations" .dreamstate/config.json

   # Load previous session summaries for context injection
   previous_summaries = dream.state.session_summaries (or [] if none)

   WHILE dream.state.active == true:
     - Determine dream type: (iterations % 3) → 0=[T], 1=[I], 2=[R]
     - Read current loop plan
     - Read FOCUS.md if exists
     - Build "Previous Sessions" section from previous_summaries
     - Spawn ds-dream-planner with:
         model={model}
         dream_type={type}
         prompt=See "Iteration Prompt Template" below
     - Agent appends ONE table row to ITERATIONS.md (with Type column)
     - Increment iterations
     - Update dream.state
     - Check if /ds:wake was called (dream.state.active == false)

     - IF iterations >= max_iterations:
         - Stop loop
         - Output: "Reached {max_iterations} iterations. Run /ds:dream to continue with fresh context."
         - Set dream.state.active = false

     - Brief pause (5 seconds)
   ```

7. On dream mode stop (via /ds:wake or max_iterations reached):
   ```
   - Read ITERATIONS.md from current session
   - Extract key findings (look for ## Findings section or last 3 iterations)
   - Create session summary:
     {
       "sessionId": "{loop_plan_folder_name}",
       "iterations": {count},
       "summary": "{prompt or 'General exploration'}: {key findings}"
     }
   - Append to dream.state.session_summaries
   - Keep only last 5 session summaries (prevent unbounded growth)
   - Write updated dream.state
   ```

8. Report dream mode started:
   ```
   Dream Mode Active
   ━━━━━━━━━━━━━━━━━
   Model: {model}
   Focus: {prompt or "General exploration"}
   Loop Plan: {path}

   Types: [T]emplate → [I]ntrospect → [R]esearch (rotating)

   Dream mode will continuously explore and analyze.
   Check progress: /ds:status
   Stop with: /ds:wake
   ```
</execution>

<iteration-prompt-template>
When spawning ds-dream-planner, use this prompt structure:

```markdown
# Dream Mode Iteration {N} of {max_iterations}

## Dream Type: {type}
This iteration is type **{type}**:
- [T] = Explore .dreamstate/templates/ for patterns
- [I] = Analyze src/ code for improvements
- [R] = Search web for external patterns

Execute ONLY this type's workflow.

## Previous Sessions (Context Preservation)
{For each session in session_summaries:}
- {sessionId} ({iterations} iter): {summary}

{If no previous sessions: "First dream session - no prior context."}

## Step 1: Read Previous Context (MANDATORY)
Before any work, understand what exists:
1. Read .dreamstate/loop_plans/*/DRAFT.md (first 20 lines each)
2. Read .dreamstate/loops/*/STATUS.md for completed work
3. Note what's been done to avoid duplicates

## Step 2: Execute Dream Type

### If [T] Template:
1. Pick 1-2 files from .dreamstate/templates/
2. Read them, extract patterns applicable to this project
3. Insight should reference the template file path

### If [I] Introspect:
1. Pick 2-3 files from src/
2. Analyze for: code smells, duplication, inconsistencies, improvements
3. Insight should describe the finding

### If [R] Research:
1. Use WebSearch with 1 focused query
2. Extract actionable patterns from results
3. Insight should cite the source

## Step 3: Focus Direction
{Contents of FOCUS.md if exists, otherwise "General exploration"}

## Step 4: Task
Based on dream type findings:
- Expand an existing loop with more detail
- OR create a new loop based on discovered patterns
- OR update MISSION.md with insights

## Output: ONE Table Row
Append exactly one row to ITERATIONS.md:
| {N} | {time} | {type} | {action} | {target} | {insight} |

No prose. No explanations. Just the table row.

## Loop Plan Location
{path to current loop plan}
```
</iteration-prompt-template>

<iteration-log>
ITERATIONS.md uses compact table format with Type column:

```markdown
# Dream Session: {session-id}
Focus: {focus} | Model: {model} | Limit: {max_iterations}

## Previous Context
- loop-01: {one-liner summary of what it does}
- loop-02: {one-liner summary}

## Iterations
| # | Time | Type | Action | Target | Insight |
|---|------|------|--------|--------|---------|
| 1 | 00:05 | [T] | discover | templates/workflow | state machine pattern |
| 2 | 00:12 | [I] | analyze | daemon/index | nesting in processTask |
| 3 | 00:20 | [R] | research | file-watchers | chokidar debounce |
```

Each iteration appends ONE row. No prose between rows.

Fields:
- `{#}`: Iteration number
- `{Time}`: MM:SS from session start
- `{Type}`: [T], [I], or [R]
- `{Action}`: discover|connect|refine|design|reflect|research|analyze
- `{Target}`: Short identifier (file path, loop-id, search topic)
- `{Insight}`: What you learned (max 10 words)

**Max 100 lines total.** If approaching limit, summarize older iterations.
</iteration-log>
