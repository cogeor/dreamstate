---
name: dg:plan
description: Enter plan mode - continuously explore and analyze the codebase
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
Enter plan mode with a specified model. Continuously iterate on exploration, code analysis, and external research until interrupted or max_iterations is reached.
</objective>

<usage>
/dg:plan [model] [theme]

Arguments:
  model - haiku (default), sonnet, or opus
  theme - Optional overarching theme that guides ALL iterations

The theme is NOT a one-time task. It's a lens through which every iteration views its work.
Plan mode continues iterating until interrupted or max_iterations is reached.

Examples:
  /dg:plan
  /dg:plan haiku
  /dg:plan sonnet "test coverage"           # Every iteration focuses on testing
  /dg:plan "error handling"                  # All iterations examine error handling
  /dg:plan opus "daemon architecture"        # Deep dive into daemon across all phases

If first argument is not a model name, it's treated as the theme (uses haiku).
</usage>

<behavior>
Plan mode is a CONTINUOUS process that keeps running until interrupted.

Each iteration selects a plan TYPE and executes that exploration (4-phase cycle):
- [T] Template - explore .delegate/templates/ for patterns
- [I] Introspect - analyze src/ code for improvements
- [R] Research - search web for external patterns
- [V] Verify - run build, run tests, create tests for missing coverage

The [V] Verify phase GROUNDS plans in reality by actually executing code.

The human can check progress anytime with /dg:status.
To stop: interrupt the process (Ctrl+C).
</behavior>

<plan-types>
## Plan Type Selection

Each iteration deterministically selects ONE type based on iteration number (4-phase cycle):
- Iteration 1, 5, 9, 13...  -> [T] Template
- Iteration 2, 6, 10, 14... -> [I] Introspect
- Iteration 3, 7, 11, 15... -> [R] Research
- Iteration 4, 8, 12, 16... -> [V] Verify

### Type [T] - Template Exploration (with fallback)
- Read 1-2 files from .delegate/templates/
- Extract patterns applicable to this project
- Compare to existing implementation
- Output insight references template file

**Fallback to [I]:** If templates are stale or unhelpful:
- Template patterns already implemented better in src/
- Template is empty or irrelevant to current theme
- No templates exist
-> Fall back to [I] Introspect for this iteration

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
</plan-types>

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

2. Check if already in plan mode:
   - Read .delegate/plan.state
   - If active, report "Already in plan mode. Interrupt to stop."

3. Create or continue do plan:
   - If no active plan, create new: .delegate/loop_plans/{timestamp}-plan-session/
   - If resuming, use existing plan

4. Initialize plan state:
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
   Write to .delegate/plan.state

   **Note**: Preserve existing `session_summaries` from previous plan.state if present.

5. If theme provided, write to {loop_plan}/THEME.md:
   ```markdown
   # Plan Session Theme

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
   max_iterations = config.daemon.auto_plan.max_iterations
   # Find config value: grep "max_iterations" .delegate/config.json

   # Load previous session summaries for context injection
   previous_summaries = plan.state.session_summaries (or [] if none)

   WHILE plan.state.active == true:
     - Determine plan type: (iterations % 4) -> 0=[T], 1=[I], 2=[R], 3=[V]
     - Read current do plan
     - Read THEME.md if exists (this guides ALL iterations, not just one)
     - Build "Previous Sessions" section from previous_summaries
     - Spawn dg-plan-planner with:
         model={model}
         plan_type={type}
         prompt=See "Iteration Prompt Template" below
     - Agent appends ONE table row to ITERATIONS.md (with Type column)
     - Increment iterations
     - Update plan.state
     - Check if interrupted (plan.state.active == false)

     - IF iterations >= max_iterations:
         - Stop loop
         - Output: "Reached {max_iterations} iterations. Run /dg:plan to continue with fresh context."
         - Set plan.state.active = false

     - Brief pause (5 seconds)
   ```

7. On plan mode stop (via interrupt or max_iterations reached):
   ```
   - Read ITERATIONS.md from current session
   - Extract key findings (look for ## Findings section or last 3 iterations)
   - Create session summary:
     {
       "sessionId": "{loop_plan_folder_name}",
       "iterations": {count},
       "summary": "{theme or 'General exploration'}: {key findings}"
     }
   - Append to plan.state.session_summaries
   - Keep only last 5 session summaries (prevent unbounded growth)
   - Write updated plan.state
   ```

8. Report plan mode started:
   ```
   Plan Mode Active
   ================
   Model: {model}
   Theme: {theme or "General exploration"}
   Do Plan: {path}

   Types: [T]emplate -> [I]ntrospect -> [R]esearch -> [V]erify (4-phase cycle)

   The theme guides ALL iterations - it's not a one-time task.
   Plan mode will continuously iterate until interrupted or max_iterations.
   Check progress: /dg:status
   ```
</execution>

<iteration-prompt-template>
When spawning dg-plan-planner, pass this context:

```markdown
# Plan Mode Iteration {N} of {max_iterations}

Theme: {theme or "General exploration"}
Type: {type} ([T]emplate, [I]ntrospect, [R]esearch, [V]erify)
Do Plan: {path}

## Previous Sessions
{For each session in session_summaries:}
- {sessionId} ({iterations} iter): {summary}

{If none: "First plan session."}
```

The agent knows its workflow from its agent definition.
</iteration-prompt-template>

<iteration-log>
## Output Structure Per Iteration

Each iteration produces THREE artifacts:

### 1. ITERATIONS.md (append row)
```markdown
| {N} | {time} | {type} | {action} | {target} | {insight} |
```

### 2. OVERVIEW.md (create iter 1, update thereafter)
Vision, implementation do items table, dependencies.

### 3. Do Draft File ({NN}-{slug}.md)
Full structure per loop-plan-structure reference.

**Every iteration = 1 complete do draft. No exceptions.**
</iteration-log>
