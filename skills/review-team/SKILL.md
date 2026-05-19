---
name: review-team
description: Use after implementation is complete to run a comprehensive 4-agent parallel review. Covers code simplification, silent failures, test coverage gaps, and type design quality. Use before merging or marking a task done.
---

# Review Team

Runs 4 parallel review agents on recently changed code, then synthesizes findings and applies fixes.

## Invocation

```
/review-team
```

Operates on the current git diff. Run after `/implement-team` completes or any significant code change.

## Workflow

### Phase 1 — Get Diff

Run `git diff` (or `git diff HEAD` if changes are staged) to get the full diff. Pass this to all 4 agents as context.

---

### Phase 2 — Parallel Review (4 agents, single message)

Spawn all 4 simultaneously with `team_name="review-team"`:

| Name | `subagent_type` | Focus |
|------|----------------|-------|
| `reviewer-simplify` | `pr-review-toolkit:code-simplifier` | Reuse existing utilities, code quality, efficiency — **applies fixes directly** |
| `reviewer-failures` | `pr-review-toolkit:silent-failure-hunter` | Silent errors, swallowed exceptions, missing error propagation, unsafe fallbacks |
| `reviewer-tests` | `pr-review-toolkit:pr-test-analyzer` | Test coverage gaps, untestable designs, missing edge case tests |
| `reviewer-types` | `pr-review-toolkit:type-design-analyzer` | Type invariants, encapsulation quality, design soundness |

**Wait for all 4 to complete before proceeding.**

---

### Phase 3 — Synthesis & Fix

Aggregate all findings into three buckets:

**Critical** (fix now — blocks merge):
- Security vulnerabilities
- Silent failures that hide real errors
- Missing tests for critical paths

**Important** (fix before merge):
- Significant code quality issues
- Poorly designed types
- Coverage gaps for edge cases

**Minor** (optional / future):
- Style preferences
- Low-impact improvements

`reviewer-simplify` already applies its fixes directly — note what it changed.

For Critical and Important issues from other reviewers: spawn `general-purpose` fix agents, then re-verify.

---

### Phase 4 — Report & Cleanup

1. Summary: what each reviewer found, what was fixed, what remains
2. Clean up:
```
SendMessage(to="*", message={type: "shutdown_request", reason: "Review complete"})
TeamDelete()
```

---

## Team Setup

```
TeamCreate(team_name="review-team", description="Review: [task/PR description]")
```

---

## Red Flags

- **Don't start Phase 3 before all 4 reviewers return** — partial results lead to missed issues
- **Don't skip TeamDelete** — always clean up after completion
- **Don't re-run reviewer-simplify after fixes** — it already applied changes; just note what it did
