---
name: git-commit-msg
description: Generates a clear git commit message and a short changelog from staged changes. Use when writing commit messages or preparing a release.
---

# Git Commit & Changelog Skill

## When to use this skill

Use this skill whenever:
- You have staged changes (`git add ...`) and need a well-structured commit message.
- You want a short changelog entry summarizing what changed.

## Instructions

1. Run `git diff --staged` to inspect the staged changes.
2. Analyze the diff and identify:
   - The main type of change (feat, fix, refactor, chore, docs, test, perf, build, ci).
   - The scope (folder, module, or feature name) if it is clear.
   - The key behavior changes and any important side effects.

3. Generate a **Conventional Commit** style subject line:

   Format:
   `type(scope): short summary`

   Rules:
   - Use imperative mood (e.g. "add", "fix", "refactor").
   - Keep under 72 characters.
   - Scope is optional; omit it if it is not obvious.

4. Write an optional body that:
   - Explains **what** changed and **why**, not implementation details.
   - Mentions any breaking changes or migrations.
   - Groups changes into bullet points where helpful.

5. Also generate a **one‑line changelog entry** suitable for a `CHANGELOG.md` “Unreleased” section:

   Format example:
   - `- Add X to improve Y in Z component.`

6. Output your response in this format:

   ```text
   Commit message:

   type(scope): short summary

   Optional body line 1
   Optional body line 2
   ...

   Changelog entry:

   - One line describing the change for CHANGELOG.md
