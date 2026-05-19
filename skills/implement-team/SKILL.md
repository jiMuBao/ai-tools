---
name: implement-team
description: Use when you have a chosen approach from research-team and need to execute it with parallel implementation agents. Use when implementing features, bug fixes, or refactors with per-task spec compliance and code quality review loops.
---

# Implement Team

Executes a chosen architectural approach using parallel implementation agents, each followed by a spec compliance + code quality review loop.

**Never writes code during research-team** — this skill is the execution phase only.

## Invocation

```
/implement-team add JWT authentication using the minimal approach
/implement-team fix login race condition using approach 1 from research
/implement-team refactor auth middleware — clean design approach
```

## Workflow

### Phase 1 — Task Decomposition (1 agent)

Spawn a single `general-purpose` agent to parse the provided approach into independent implementation tasks:

```
Analyze this implementation approach and break it into independent tasks:
[APPROACH DESCRIPTION]

Return a numbered list of tasks, each with:
- Task name
- Files to create or modify
- What it needs to do
- Dependencies (which tasks must complete first, if any)
```

**Present the task breakdown to the user and wait for confirmation before proceeding.**

---

### Phase 2 — Parallel Implementation

Spawn all independent tasks simultaneously in a single message (tasks with no dependencies first). Use `team_name="implement-team"` for all agents.

| Name | `subagent_type` | Prompt focus |
|------|----------------|-------------|
| `coder-[task-name]` | `general-purpose` | Implement exactly this task: [task description + files] |

Each coder agent should:
1. Read existing code before modifying
2. Implement only what's specified (no scope creep)
3. Run tests if applicable
4. Return: what was done, files changed, any blockers

Wait for all parallel coders to complete before Phase 3.

---

### Phase 3 — Per-Task Review Loop

For each completed coder, immediately spawn 2 parallel reviewers:

| Name | `subagent_type` | Focus |
|------|----------------|-------|
| `review-spec-[task]` | `feature-dev:code-reviewer` | Spec compliance — does the code match the task requirement exactly? |
| `review-quality-[task]` | `superpowers:code-reviewer` | Code quality — bugs, security, edge cases, best practices |

**If issues found:** spawn a `general-purpose` fix agent → re-run both reviewers → repeat until clean.

---

### Phase 4 — Summary & Cleanup

1. Report: tasks completed, files changed, issues found and fixed
2. Clean up:
```
SendMessage(to="*", message={type: "shutdown_request", reason: "Implementation complete"})
TeamDelete()
```

---

## Team Setup

```
TeamCreate(team_name="implement-team", description="Implement: [TASK]")
```

---

## Red Flags

- **Don't start Phase 2 before user confirms the task breakdown** — wrong decomposition means wrong implementation
- **Don't skip the review loop** — even trivial tasks need both spec + quality reviewers
- **Don't run dependent tasks in parallel** — check dependencies from Phase 1 decomposition
- **Don't forget TeamDelete** — always clean up after completion
- **Don't scope creep** — each coder implements only its assigned task
