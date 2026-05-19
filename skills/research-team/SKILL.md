---
name: research-team
description: Use when tackling any non-trivial task — features, bugs, refactors, investigations — and want thorough parallel research, multiple solution approaches, and adversarial review before acting
---

# Research Team

## Overview

Spins up an 8-agent team that researches deeply, proposes two solution approaches, then tears them apart before you commit to anything. Works for features, bugs, refactors, and investigations.

## Invocation

```
/research-team add JWT authentication
/research-team fix login race condition
/research-team refactor auth middleware
/research-team why is checkout so slow
```

## Workflow

### Phase 1 — Parallel Research (3 explorers)

Spawn all 3 simultaneously with `team_name="research-team"`. Wait for all 3 before proceeding.

| Name | `subagent_type` | Focus |
|------|----------------|-------|
| `explorer-1` | `feature-dev:code-explorer` | Trace execution paths, similar existing code, reusable patterns |
| `explorer-2` | `feature-dev:code-explorer` | Map architecture, abstractions, extension points, failure points |
| `explorer-3` | `feature-dev:code-explorer` | Identify tests, integrations, edge cases, external dependencies |

**Adapt explorer prompts to task type:**
- Feature → "find similar features and patterns we can reuse"
- Bug → "trace the failure path and identify root cause candidates"
- Investigation → "profile relevant code paths and find bottlenecks"

Each explorer should return: findings summary + top 8-10 key files.

---

### Phase 2 — Parallel Architecture (2 architects)

Feed **all 3 explorer summaries** into both architects simultaneously. Wait for both.

| Name | `subagent_type` | Approach |
|------|----------------|----------|
| `architect-1` | `feature-dev:code-architect` | **Minimal change** — max reuse, fewest new files, surgical |
| `architect-2` | `feature-dev:code-architect` | **Clean/thorough** — proper design, future-proof, maintainable |

**Adapt architect prompts to task type:**
- Feature → "design implementation approaches"
- Bug → "design fix approaches: minimal patch vs proper fix"
- Refactor → "design refactor strategies: incremental vs full rewrite"

Each architect should return: blueprint with files to create/modify + data flow.

---

### Phase 3 — Devil's Advocate (3 parallel critics)

Feed **all explorer findings + both architectural proposals** into all 3 critics simultaneously. Wait for all 3.

| Name | `subagent_type` | Attacks |
|------|----------------|---------|
| `critic-quality` | `feature-dev:code-reviewer` | Logic errors, security holes, edge cases, regression risk + **verdict** on which approach is stronger |
| `critic-failures` | `pr-review-toolkit:silent-failure-hunter` | Silent failures, swallowed errors, unsafe fallbacks, missing error propagation |
| `critic-tests` | `pr-review-toolkit:pr-test-analyzer` | Test coverage gaps, untestable designs, missing edge case tests |

Prompt all 3 critics to challenge **both** proposals, not just one.

---

### Phase 4 — Synthesis & Shutdown

1. Summarize: explorer findings → architect blueprints → all 3 critiques
2. Present to user: "Which approach do you want to proceed with?"
3. After user decides, shutdown:
   ```
   SendMessage(to="*", message={type: "shutdown_request", reason: "Research complete"})
   TeamDelete()
   ```

---

## Team Setup

```
TeamCreate(team_name="research-team", description="Research team for: [TASK]")
```

All agents are spawned with `team_name="research-team"` and a unique `name`.

---

## Red Flags

- **Don't start Phase 2 before all 3 explorers return** — architects need full research context
- **Don't start Phase 3 before both architects return** — critics need both proposals to compare
- **Don't skip the synthesis** — raw agent outputs are not enough; distill into a clear decision for the user
- **Don't forget TeamDelete** — always clean up after the session
