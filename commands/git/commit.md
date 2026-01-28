---
description: Generates a clear git commit message and a short changelog from staged changes. Use when writing commit messages or preparing a release.
---

Run `git diff --staged` to inspect the staged changes: !`git diff --staged`

Run `git branch --show-current` to get the current branch name: !`git branch --show-current`

Analyze the diff and identify:
- The main type of change (feat, fix, refactor, chore, docs, test, perf, build, ci).
- The scope (folder, module, or feature name) if it is clear.
- The key behavior changes and any important side effects.

Generate a Conventional Commit style subject line with branch name prefix:

Format:
`branch-name: type(scope): short summary`

Rules:
- Use the branch name exactly as-is at the beginning (for JIRA tracking).
- Use imperative mood for the summary (e.g. "add", "fix", "refactor").
- Keep under 72 characters.
- Scope is optional; omit it if it is not obvious.

Write an optional body that:
- Explains **what** changed and **why**, not implementation details.
- Mentions any breaking changes or migrations.
- Groups changes into bullet points where helpful.

Also generate a **one‑line changelog entry** suitable for a `CHANGELOG.md` "Unreleased" section:

Format example:
- `- Add X to improve Y in Z component.`

Output your response in this format:

```text
Commit message:

branch-name: type(scope): short summary

Optional body line 1
Optional body line 2
...

Changelog entry:

- One line describing the change for CHANGELOG.md
```
