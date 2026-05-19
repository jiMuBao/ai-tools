---
name: cb-pr
description: List and inspect Bitbucket pull requests for the current git repo. Use when the user types /cb-pr, asks to "list PRs", "show open pull requests", "what PRs are open", or wants details on a specific PR by number (reviewers, CI status, branches, description). Auto-detects the repo from the origin remote. Requires BITBUCKET_USERNAME and BITBUCKET_TOKEN env vars. Does NOT review diffs — for that, use bitbucket-review-pr.
---

# cb-pr — Bitbucket PR listing & inspection

Run the bundled script and pass through whatever arguments the user supplied. The script must run from a directory inside the target Bitbucket clone (it reads `git remote origin`).

```bash
bash ~/.claude/skills/cb-pr/scripts/cb-pr.sh [args]
```

## Invocations

| Args            | Action                                                         |
|-----------------|----------------------------------------------------------------|
| (none) / `open` | List open PRs, newest activity first                           |
| `merged`        | Up to 50 most-recently-merged PRs                              |
| `mine`          | Open PRs authored by `$BITBUCKET_USERNAME`                     |
| `<number>`      | PR details: state, branches, reviewers, description, CI status |

## Behavior

- The script auto-detects the workspace/slug from `git remote get-url origin` (handles SSH and HTTPS Bitbucket Cloud URLs).
- Auths with `$BITBUCKET_USERNAME` / `$BITBUCKET_TOKEN`.
- Output is plain text, already formatted for terminal display. Present the script's stdout verbatim — do not reformat unless the user asks.

## Errors to surface as-is

- Missing env vars → tell user to export `BITBUCKET_USERNAME` and `BITBUCKET_TOKEN`.
- 401 → token likely expired; user should refresh `BITBUCKET_TOKEN`.
- 404 on PR number → wrong repo or PR doesn't exist.
- Non-Bitbucket / missing `origin` → tell user to `cd` into a Bitbucket clone first.
