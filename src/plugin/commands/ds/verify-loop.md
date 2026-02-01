---
name: ds:verify-loop
description: Complete a loop reflection to assess value, quality, and coverage
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

<objective>
Guide the user through a structured reflection on a completed loop. Creates REFLECTION.md with assessments and recommendations based on GSD verification patterns.
</objective>

<usage>
/ds:verify-loop [loop_id]

Arguments:
  loop_id   Optional. Loop folder name or path. If omitted, picks oldest unreflected completed loop.

Examples:
  /ds:verify-loop                              # Reflect on oldest pending
  /ds:verify-loop 20260202-doc-validator       # Reflect on specific loop
  /ds:verify-loop .dreamstate/loops/20260202-doc-validator  # Full path
</usage>

<execution>
1. **Find target loop:**
   ```
   IF loop_id provided:
     target = find loop matching loop_id
   ELSE:
     Find all completed loops (STATUS.md phase: complete)
     Filter out loops with REFLECTION.md
     Sort by timestamp ascending
     target = oldest unreflected loop
   ```
   If no target found, inform user and exit.

2. **Read loop artifacts:**
   - DRAFT.md (original intent)
   - PLAN.md (detailed plan)
   - IMPLEMENTATION.md (what was done)
   - TEST.md (verification results)
   - COMMIT.md (commit info)

3. **Analyze and assess** (see Assessment Criteria below)

4. **Generate REFLECTION.md** using template

5. **Output summary** to user
</execution>

<assessment-criteria>
## Value Assessment (1-5)

**5 - Essential**: Enables critical functionality, unblocks other work
**4 - High Value**: Significant improvement, clear user benefit
**3 - Useful**: Nice to have, improves experience
**2 - Marginal**: Minor benefit, could have skipped
**1 - Questionable**: Unclear value, may have wasted effort

Consider:
- Does this enable other work?
- Does it solve a real problem?
- Could we have achieved the same with less?

## Implementation Quality (1-5)

**5 - Excellent**: Clean, follows patterns, no tech debt
**4 - Good**: Minor issues, generally solid
**3 - Acceptable**: Works but has rough edges
**2 - Needs Work**: Multiple issues, should refactor
**1 - Poor**: Significant problems, creates tech debt

Consider:
- Does it follow existing patterns?
- Is there code bloat or duplication?
- Are there any obvious bugs or edge cases?

## Test Coverage (1-5)

**5 - Comprehensive**: All paths tested, edge cases covered
**4 - Good**: Main paths tested, some edge cases
**3 - Basic**: Happy path only, no edge cases
**2 - Minimal**: Partial coverage, gaps exist
**1 - None**: No tests or verification

Consider:
- Are critical paths tested?
- What could break that isn't tested?
- Is the test approach appropriate (unit vs integration)?
</assessment-criteria>

<reflection-template>
# Loop Reflection: {loop_name}

Reflected: {timestamp}
Loop Completed: {commit_date}
Commit: {commit_hash}

## Summary

**What**: {one-line summary of what was implemented}
**Why**: {why it was needed}
**Result**: {outcome - success/partial/needs-work}

## Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Value | {1-5} | {brief explanation} |
| Quality | {1-5} | {brief explanation} |
| Coverage | {1-5} | {brief explanation} |

**Overall**: {average}/5

## Analysis

### What Went Well
- {positive aspect 1}
- {positive aspect 2}

### What Could Improve
- {improvement area 1}
- {improvement area 2}

### Risks & Concerns
- {any risks introduced}
- {technical debt created}

## Recommendations

### Immediate (should do now)
- [ ] {critical follow-up}

### Future (consider later)
- [ ] {potential improvement}

## Integration Checklist

- [ ] Error handling covers expected failures
- [ ] Works with existing features
- [ ] No breaking changes to public APIs
- [ ] Documentation updated if needed

## Notes

{any additional observations}
</reflection-template>

<output>
Display reflection summary:

```
Loop Reflection: {loop_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Assessment:
  Value:    ★★★★☆ (4/5)
  Quality:  ★★★☆☆ (3/5)
  Coverage: ★★★★☆ (4/5)
  Overall:  3.7/5

Key Findings:
  ✓ {what went well}
  △ {what could improve}

Recommendations:
  → {immediate action}

REFLECTION.md written to {loop_folder}
```
</output>
