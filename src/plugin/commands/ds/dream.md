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
/ds:dream [model] [theme]

Arguments:
  model - haiku (default), sonnet, or opus
  theme - Optional overarching theme that guides ALL iterations

The theme is NOT a one-time task. It's a lens through which every iteration views its work.
Dream mode continues iterating until /ds:wake or max_iterations is reached.

Examples:
  /ds:dream
  /ds:dream haiku
  /ds:dream sonnet "test coverage"           # Every iteration focuses on testing
  /ds:dream "error handling"                  # All iterations examine error handling
  /ds:dream opus "daemon architecture"        # Deep dive into daemon across all phases

If first argument is not a model name, it's treated as the theme (uses haiku).
</usage>

<behavior>
Dream mode is a CONTINUOUS process that keeps running until /ds:wake is called.

Each iteration selects a dream TYPE and executes that exploration (4-phase cycle):
- [T] Template - explore .dreamstate/templates/ for patterns
- [I] Introspect - analyze src/ code for improvements
- [R] Research - search web for external patterns
- [V] Verify - run build, run tests, create tests for missing coverage

The [V] Verify phase GROUNDS dreams in reality by actually executing code.

The human can check progress anytime with /ds:status.
To stop: /ds:wake
</behavior>

<dream-types>
## Dream Type Selection

Each iteration deterministically selects ONE type based on iteration number (4-phase cycle):
- Iteration 1, 5, 9, 13...  → [T] Template
- Iteration 2, 6, 10, 14... → [I] Introspect
- Iteration 3, 7, 11, 15... → [R] Research
- Iteration 4, 8, 12, 16... → [V] Verify

### Type [T] - Template Exploration (with fallback)
- Read 1-2 files from .dreamstate/templates/
- Extract patterns applicable to this project
- Compare to existing implementation
- Output insight references template file

**Fallback to [I]:** If templates are stale or unhelpful:
- Template patterns already implemented better in src/
- Template is empty or irrelevant to current theme
- No templates exist
→ Fall back to [I] Introspect for this iteration

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

### Type [V] - Verify Execution (GROUNDING)
- Run `npm run build` to verify code compiles
- Run `npm test` to see current test status
- Identify untested modules from previous [I] findings
- Create test files (*.test.ts only) for missing coverage
- Output insight includes build/test status (e.g., "build OK, 5/8 tests pass")
- MUST NOT modify non-test source code
</dream-types>

<execution>
1. Parse arguments:
   ```
   IF no arguments:
     model = "haiku", theme = null
   ELSE IF first arg is "haiku"|"sonnet"|"opus":
     model = first arg
     theme = remaining args joined (or null)
   ELSE:
     model = "haiku"
     theme = all args joined
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
     "theme": "{theme or null}",
     "iterations": 0,
     "currentLoopPlan": "{path}",
     "lastIteration": null,
     "tokensUsed": 0,
     "session_summaries": []
   }
   ```
   Write to .dreamstate/dream.state

   **Note**: Preserve existing `session_summaries` from previous dream.state if present.

5. If theme provided, write to {loop_plan}/THEME.md:
   ```markdown
   # Dream Session Theme

   > This theme guides ALL iterations. It is not a one-time task.
   > Every iteration should view its work through this lens.

   **Theme:** {theme}

   ## How to Apply This Theme

   - [T] Template: Look for templates related to "{theme}"
   - [I] Introspect: Analyze src/ code specifically for "{theme}" concerns
   - [R] Research: Search for best practices around "{theme}"
   - [V] Verify: Test and verify "{theme}" aspects work correctly

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
     - Determine dream type: (iterations % 4) → 0=[T], 1=[I], 2=[R], 3=[V]
     - Read current loop plan
     - Read THEME.md if exists (this guides ALL iterations, not just one)
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
       "summary": "{theme or 'General exploration'}: {key findings}"
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
   Theme: {theme or "General exploration"}
   Loop Plan: {path}

   Types: [T]emplate → [I]ntrospect → [R]esearch → [V]erify (4-phase cycle)

   The theme guides ALL iterations - it's not a one-time task.
   Dream mode will continuously iterate until /ds:wake or max_iterations.
   Check progress: /ds:status
   Stop with: /ds:wake
   ```
</execution>

<iteration-prompt-template>
When spawning ds-dream-planner, use this prompt structure:

```markdown
# Dream Mode Iteration {N} of {max_iterations}

## Session Theme (APPLIES TO ALL ITERATIONS)
{If THEME.md exists:}
**Theme: {theme}**
This theme guides your exploration. View all work through this lens.
Do NOT treat this as a one-time task - it's an overarching direction.

{If no theme: "General exploration - no specific theme."}

## Dream Type: {type}
This iteration is type **{type}**:
- [T] = Explore .dreamstate/templates/ for patterns related to theme
- [I] = Analyze src/ code for improvements related to theme
- [R] = Search web for patterns related to theme
- [V] = Run build, run tests, verify theme-related functionality

Execute ONLY this type's workflow, but always through the theme lens.

## Previous Sessions (Context Preservation)
{For each session in session_summaries:}
- {sessionId} ({iterations} iter): {summary}

{If no previous sessions: "First dream session - no prior context."}

## Step 1: Read Previous Context (MANDATORY)
Before any work, understand what exists:
1. Read .dreamstate/loop_plans/*/DRAFT.md (first 20 lines each)
2. Read .dreamstate/loops/*/STATUS.md for completed work
3. Note what's been done to avoid duplicates

## Step 2: Execute Dream Type (Through Theme Lens)

### If [T] Template:
1. Check if .dreamstate/templates/ exists and has useful content
2. Pick 1-2 files relevant to the session theme
3. Compare template patterns to current src/ implementation
4. **EVALUATE:** Is this template useful?
   - Already implemented better in src/? → STALE
   - Empty or irrelevant to theme? → UNHELPFUL
   - No templates exist? → MISSING
5. **If STALE/UNHELPFUL/MISSING:** Fall back to [I] Introspect instead
   - Log: "| N | time | [T→I] | fallback | reason | insight |"
6. If useful: Extract patterns, insight references template file path

### If [I] Introspect:
1. Pick 2-3 files from src/
2. Analyze specifically for theme-related concerns
3. Also look for: code smells, duplication, inconsistencies
4. Insight should describe the finding

### If [R] Research:
1. Use WebSearch with 1 focused query related to theme
2. Extract actionable patterns from results
3. Insight should cite the source

### If [V] Verify:
1. Run `npm run build` - verify code compiles
2. Run `npm test` - see current test status
3. Focus on testing theme-related functionality
4. Create test files for untested modules (*.test.ts only)
5. Insight should include build/test status

## Step 3: Task
Based on dream type findings:
- Expand an existing loop with more detail
- OR create a new loop based on discovered patterns
- OR update MISSION.md with insights

## Output: ONE Table Row
Append exactly one row to ITERATIONS.md:
| {N} | {time} | {type} | {action} | {target} | {insight} |

No prose. No explanations. Just the table row.

**IMPORTANT: This is iteration {N} of {max_iterations}. Dream mode continues until /ds:wake or max reached.**

## Loop Plan Location
{path to current loop plan}
```
</iteration-prompt-template>

<iteration-log>
ITERATIONS.md uses compact table format with Type column:

```markdown
# Dream Session: {session-id}
Theme: {theme or "General"} | Model: {model} | Limit: {max_iterations}

## Previous Context
- loop-01: {one-liner summary of what it does}
- loop-02: {one-liner summary}

## Iterations
| # | Time | Type | Action | Target | Insight |
|---|------|------|--------|--------|---------|
| 1 | 00:05 | [T] | discover | templates/workflow | state machine pattern |
| 2 | 00:12 | [I] | analyze | daemon/index | nesting in processTask |
| 3 | 00:20 | [R] | research | file-watchers | chokidar debounce |
| 4 | 00:28 | [V] | verify | npm test | build OK, 3/5 tests pass |
| 5 | 00:35 | [T→I] | fallback | templates stale | daemon/ipc needs error handling |
```

Each iteration appends ONE row. No prose between rows.

Fields:
- `{#}`: Iteration number
- `{Time}`: MM:SS from session start
- `{Type}`: [T], [I], [R], [V], or [T→I] (fallback from stale template)
- `{Action}`: discover|connect|refine|design|reflect|research|analyze|verify|test|fallback
- `{Target}`: Short identifier (file path, loop-id, search topic)
- `{Insight}`: What you learned (max 10 words)

**Max 100 lines total.** If approaching limit, summarize older iterations.
</iteration-log>
