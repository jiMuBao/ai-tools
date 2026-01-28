---
name: git-commit-msg
description: "Generate Conventional Commit style commit messages with branch name or Jira ticket prefix and short changelogs from staged git changes. Use when creating commit messages after git add, preparing release notes, needing structured commit history, or working with projects using conventional commits standard with Jira tracking."
---

# Git Commit & Changelog Skill

## Workflow Overview

Generating commit messages involves these steps:

1. Run `git diff --staged` to inspect the staged changes
2. Run `git branch --show-current` to get the current branch name
3. Analyze the diff to identify type, scope, and behavior changes
4. Generate a Conventional Commit style subject line with branch name prefix
5. Write an optional body explaining what changed and why
6. Generate a one-line changelog entry
7. Output in the specified format

## Instructions

### Step 1: Inspect staged changes

Run `git diff --staged` to see all changes that will be committed.

### Step 2: Get branch name

Run `git branch --show-current` to get the current branch name. Extract any Jira ticket or issue identifier (e.g., JIRA-123, PROJ-456) or use the full branch name.

### Step 3: Analyze the diff

Identify:
- **Type**: feat, fix, refactor, chore, docs, test, perf, build, ci
- **Scope** (optional): folder, module, or feature name
- **Key behavior changes**: what functionality changed
- **Important side effects**: breaking changes, migrations, etc.

### Step 4: Generate subject line

Follow this Conventional Commit format with branch name prefix:

```
[branch-name-or-ticket]: type(scope): short summary
```

**Rules:**
- Prefix with branch name or Jira ticket identifier (e.g., "JIRA-123:", "feature/auth:")
- Use imperative mood ("add", "fix", "refactor")
- Keep the full line under 72 characters
- Scope is optional; omit if not obvious

### Step 5: Write optional body

Explain:
- What changed and why (not implementation details)
- Any breaking changes or migrations
- Group related changes into bullet points

### Step 6: Generate changelog entry

Create one line suitable for `CHANGELOG.md`:

```
- Add X to improve Y in Z component.
```

### Step 7: Output format

ALWAYS use this exact format:

```
Commit message:

[branch-name-or-ticket]: type(scope): short summary

Optional body line 1
Optional body line 2
...

Changelog entry:

- One line describing the change for CHANGELOG.md
```

## Examples

### Example 1: New feature

**Input:** Added user authentication with JWT tokens, branch: JIRA-123

**Output:**
```
Commit message:

JIRA-123: feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware to secure API routes.

Changelog entry:

- Add JWT-based authentication to secure API endpoints.
```

### Example 2: Bug fix

**Input:** Fixed bug where dates displayed incorrectly in reports, branch: PROJ-456

**Output:**
```
Commit message:

PROJ-456: fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation to ensure accurate date display across timezones.

Changelog entry:

- Fix date formatting in report timezone conversion.
```

### Example 3: Refactoring

**Input:** Extracted common validation logic into shared utility functions, branch: refactor/validation

**Output:**
```
Commit message:

refactor/validation: refactor(utils): extract common validation logic

Create reusable validation utilities to reduce code duplication across form handlers.

Changelog entry:

- Extract common validation logic into shared utility functions.
```

### Example 4: Documentation

**Input:** Updated API documentation with new endpoints, branch: docs/update-api

**Output:**
```
Commit message:

docs/update-api: docs(api): update documentation with v2 endpoints

Document new authentication endpoints and revised request/response schemas.

Changelog entry:

- Update API documentation with v2 endpoints.
```

### Example 5: Breaking change

**Input:** Changed user table structure, migrated existing users, branch: JIRA-789

**Output:**
```
Commit message:

JIRA-789: feat(users): restructure user table for improved indexing

BREAKING CHANGE: User table schema changed. Run migration script to update existing user records.

Changelog entry:

- Restructure user table for improved indexing (requires migration).
```
