# Dreamstate Patterns

Patterns extracted from reference codebases (get-shit-done).
Use these patterns when designing agents, commands, and workflows.

---

## 1. State Management

### 1.1 Size Constraint
```
Keep STATE.md under 100 lines.
```

**Philosophy:** It's a DIGEST, not an archive. If accumulated context grows too large, it defeats the purpose of quick session restoration.

### 1.2 State Lifecycle
| Event | Action |
|-------|--------|
| Project init | Create STATE.md with empty context sections |
| Every workflow start | Read STATE.md first |
| After significant action | Update position, decisions, blockers |
| After phase complete | Refresh, clear resolved blockers |

### 1.3 Session Continuity
```markdown
Last session: [YYYY-MM-DD HH:MM]
Stopped at: [Description of last completed action]
Resume file: [Path to .continue-here*.md if exists]
```

---

## 2. Context Quality Curve

### 2.1 Degradation by Context Usage
| Usage | Quality | Claude's State |
|-------|---------|----------------|
| 0-30% | PEAK | Thorough, careful |
| 30-50% | GOOD | Solid work |
| 50-70% | DEGRADING | Efficiency mode, shortcuts |
| 70%+ | POOR | Rushed, error-prone |

### 2.2 Split Triggers
- More than 3 tasks → split into multiple plans
- Multiple subsystems affected → separate plans
- More than 5 files per task → too broad

### 2.3 Fresh Context Pattern
- Spawn subagents for autonomous work
- Each subagent gets fresh 200k context
- Reserve main context for user interaction
- Target: complete work within 50% of context

---

## 3. Lazy Loading

### 3.1 @-References
```
@-references are lazy loading signals.
They tell Claude what to read, not pre-loaded content.
```

**Static references:** Always load
```
@~/.claude/get-shit-done/workflows/execute-phase.md
@.planning/PROJECT.md
```

**Conditional references:** Based on existence
```
@.planning/DISCOVERY.md (if exists)
```

### 3.2 Context Push vs Pull
| Approach | Description | Use When |
|----------|-------------|----------|
| Push | Coordinator prepares minimal bundle | Agent needs specific context |
| Pull | Agent explores with Glob/Grep | Research/discovery phase |

---

## 4. Deviation Handling

### 4.1 Automatic Rules (No Permission Needed)

**Rule 1: Auto-fix bugs**
- Wrong logic, type errors, null pointer exceptions
- Security vulnerabilities
- Process: Fix inline, add test, track for summary

**Rule 2: Auto-add missing critical functionality**
- Missing error handling, input validation
- Missing auth checks, CSRF protection
- Process: Add inline, add test, track for summary

**Rule 3: Auto-fix blocking issues**
- Missing dependencies, broken imports
- Build/config errors
- Process: Fix to unblock, continue task

### 4.2 Permission Required

**Rule 4: Ask about architectural changes**
- New database tables
- Switching libraries/frameworks
- New infrastructure components
- Process: STOP, present options, wait for decision

### 4.3 Priority
1. If Rule 4 applies → STOP and ask
2. If Rules 1-3 apply → Fix automatically
3. If unsure → Apply Rule 4 (ask)

---

## 5. Segmented Execution

### 5.1 Why Segment
Fresh context per subagent preserves peak quality. Main context stays lean (~15% usage).

### 5.2 Segment Routing Rules
| Segment Position | Route To |
|-----------------|----------|
| First segment (no prior checkpoint) | Subagent |
| After checkpoint:human-verify | Subagent |
| After checkpoint:decision | Main context |

### 5.3 Execution Pattern
```
[1] Spawn subagent for tasks 1-3
    → Subagent completes, reports results
[2] Execute checkpoint (human-verify) in main
    → User approves
[3] Spawn NEW subagent for tasks 4-5
    → Subagent completes, reports results
[4] Aggregate all results → SUMMARY → commit
```

---

## 6. Decision Documentation

### 6.1 Good Decisions (Concrete)
- "Card-based layout, not timeline"
- "Retry 3 times on network failure, then fail"
- "Group by year, then by month"
- "JSON for programmatic use, table for humans"

### 6.2 Bad Decisions (Vague)
- "Should feel modern and clean"
- "Good user experience"
- "Fast and responsive"

### 6.3 Claude's Discretion Section
Explicitly note areas where agent has flexibility:
```markdown
### Claude's Discretion
- Loading skeleton design
- Exact spacing and typography
- Error state handling
```

---

## 7. Verification Patterns

### 7.1 Three-Level Artifact Verification
| Level | Check | Status |
|-------|-------|--------|
| 1. Exists | File present? | MISSING if not |
| 2. Substantive | Real implementation? (not stub) | STUB if placeholder |
| 3. Wired | Connected to system? | ORPHANED if unused |

### 7.2 Stub Detection Patterns
```bash
# Comment-based stubs
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"

# Placeholder text
grep -E "placeholder|coming soon|will be here" "$file" -i

# Empty implementations
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"

# React component stubs
grep -E "return <div>.*</div>" "$file"  # Minimal return
grep -E "onClick=\{\\(\\) => \{\}\}" "$file"  # Empty handler
```

### 7.3 Goal-Backward Verification
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

---

## 8. Agent Tracking

### 8.1 Resume Capability
```json
{
  "agent_id": "abc123",
  "task_description": "Execute tasks 1-3",
  "phase": "01",
  "plan": "02",
  "segment": 1,
  "timestamp": "2026-02-01T20:00:00Z",
  "status": "spawned",
  "completion_timestamp": null
}
```

### 8.2 Interrupted Session Recovery
```bash
# Check for interrupted agent
if [ -f .planning/current-agent-id.txt ]; then
  INTERRUPTED_ID=$(cat .planning/current-agent-id.txt)
  echo "Found interrupted agent: $INTERRUPTED_ID"
  # Offer: Resume or start fresh?
fi
```

---

## 9. Commit Patterns

### 9.1 One Commit Per Task
```bash
# Stage only task-related files (NEVER git add . or git add -A)
git add src/api/auth.ts
git add src/types/user.ts

# Commit with type and scope
git commit -m "feat(08-02): create user registration endpoint"
```

### 9.2 Commit Types
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `test` | Tests only (TDD RED) |
| `refactor` | Code cleanup (TDD REFACTOR) |
| `docs` | Documentation |
| `chore` | Build, config, deps |

---

## 10. Anti-Patterns

### 10.1 Banned Patterns
- Time estimates ("this will take 2-3 days")
- Enterprise patterns (story points, sprint ceremonies)
- Temporal language in implementation docs ("we changed X to Y")
- Generic XML tags (`<section>`, `<item>`, `<content>`)
- Vague tasks without verification criteria

### 10.2 Context Anti-Patterns
- Unbounded Glob/Grep exploration
- Loading full file contents "just in case"
- Accumulating historical context without pruning
- Passing full PLAN.md to executor (should be single task)

---

*Extracted from: get-shit-done templates*
*Last updated: 2026-02-01*
