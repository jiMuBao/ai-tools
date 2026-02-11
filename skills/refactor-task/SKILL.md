---
name: refactor-task
description: "Safe code refactoring with mandatory regression testing. Use when restructuring, reorganizing, or improving code quality without changing external behavior. Triggers on: refactor this, extract function/method/class, split this class, reorganize this module, clean up this code, reduce duplication, or general code improvement tasks."
---

# Refactor Task

## Core Principle

**Refactoring must not change external behavior.** The invariant is simple: tests pass before, you refactor, tests pass after. If tests break, revert immediately.

## Workflow

### Step 0: Create an Isolated Branch

Before touching any code, create an isolated working branch.

**Preferred: git worktree** (allows side-by-side comparison with original):
```bash
git worktree add ../refactor-<name> -b refactor/<name>
cd ../refactor-<name>
```

**Fallback: standard branch:**
```bash
git checkout -b refactor/<name>
```

### Step 1: Discover Project Commands

Detect the project's test, lint, and type-check commands by scanning configuration files. Check these sources in order:

| Source | Look for |
|--------|----------|
| `CLAUDE.md` | Explicit test/lint/build commands |
| `Makefile` / `justfile` | `test`, `lint`, `check`, `typecheck` targets |
| `package.json` | `scripts.test`, `scripts.lint`, `scripts.typecheck` |
| `composer.json` | `scripts.test`, `scripts.phpstan`, `scripts.phpcs` |
| `pyproject.toml` | `[tool.pytest]`, `[tool.ruff]`, `[tool.mypy]` sections |
| `Cargo.toml` | Presence implies `cargo test`, `cargo clippy` |
| `go.mod` | Presence implies `go test ./...`, `golangci-lint run` |
| `.github/workflows/` | CI job steps reveal exact commands |

Store the discovered commands for use in Steps 2 and 5. If no test commands are found, **ask the user** before proceeding.

### Step 2: Establish Baseline

Run the full test suite and record the results:

```
Baseline:
  Tests: X passed, Y skipped, Z failed
  Lint: clean / N warnings
  Types: clean / N errors
```

**STOP if baseline tests fail.** Do not begin refactoring on a broken test suite. Report the failures and ask the user how to proceed.

### Step 3: Scope Analysis

Before making changes, map out what you're working with:

1. **Dependencies** - What does this code depend on? (imports, injected services, database calls)
2. **Dependents** - What depends on this code? (callers, subclasses, consumers)
3. **Public interface** - Method signatures, return types, exceptions/errors thrown, side effects
4. **External contracts** - API responses, database schemas, file formats, event emissions

The public interface is your contract. It must not change unless the user explicitly requests it.

### Step 4: Incremental Refactoring

Apply changes in small, testable increments. For each increment:

1. Make **one logical change** (extract a method, move a class, rename a variable)
2. Run the relevant test subset immediately
3. If tests pass: **commit** with a descriptive message
4. If tests fail: **revert** the change and try a different approach

**Never batch unrelated changes.** Each commit should be independently revertable.

Commit message format:
```
refactor(<scope>): <what changed>

<why this improves the code>
```

### Step 5: Final Verification

After all increments are complete:

1. Run the **full test suite** (not just the subset)
2. Run the **linter**
3. Run the **type checker** (if available)
4. Compare results with the Step 2 baseline

```
Final:
  Tests: X passed (baseline: X), Y skipped, Z failed
  Lint: clean
  Types: clean
```

The pass count must be >= baseline. If any tests that previously passed now fail, investigate and fix before declaring done.

## Common Refactoring Patterns

### Extract Function/Method
Pull a block of code into a named function. Use when you see a comment explaining what a block does, or duplicated logic.

### Extract Class
Move a group of related fields and methods into a new class. Use when a class has multiple responsibilities.

### Inline
Replace a function call with the function body. Use when the function name says nothing the body doesn't, or when it's called exactly once.

### Replace Conditional with Polymorphism
Replace a switch/if-else chain with subclasses or strategy objects. Use when the same condition is checked in multiple places.

### Move to Module/File
Relocate code to a more appropriate location. Use when a function doesn't belong with its neighbors.

## Red Flags - Stop and Reconsider

- **Tests fail after a change** - Revert, don't patch tests to match new behavior
- **You need to change test assertions** - That's a behavior change, not a refactor
- **Public API surface is growing** - Refactoring should simplify, not expand
- **Test coverage is decreasing** - You may be deleting tested code paths
- **You're adding features** - Refactoring and feature work must be separate commits
- **The change is getting large** - Break it into smaller PRs

## Checklist

### Before Starting
- [ ] Branch created and isolated
- [ ] Test/lint/type-check commands discovered
- [ ] Baseline tests pass and results recorded
- [ ] Scope and dependencies mapped
- [ ] Public interface documented

### During Refactoring
- [ ] One logical change at a time
- [ ] Tests run after every change
- [ ] Each passing change committed immediately
- [ ] Failing changes reverted, not patched

### After Completing
- [ ] Full test suite passes
- [ ] Linter passes
- [ ] Type checker passes (if available)
- [ ] Pass count >= baseline
- [ ] No public interface changes (unless explicitly requested)
- [ ] Each commit is independently revertable
