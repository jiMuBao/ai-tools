---
name: bitbucket-review-pr
description: Use when asked to review a Bitbucket pull request by URL or PR number, or when you want to run an automated code review on a Bitbucket PR
---

# Bitbucket PR Review

Runs parallel review agents on a Bitbucket PR, scores issues by confidence, shows findings, then asks permission before posting.

**Invocation:**
- `/bitbucket-review-pr https://bitbucket.org/workspace/repo/pull-requests/123`
- `/bitbucket-review-pr 136`

---

## Step 1 — Check Token Setup

```bash
echo "${BITBUCKET_TOKEN:+set}" && echo "${BITBUCKET_USERNAME:+set}"
```

If either is blank → show instructions from `setup.md` and **STOP**. Do not proceed without both variables set.

Test auth:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/user"
```
- **200 or 403** = auth works → continue
- **401** = bad credentials → show `setup.md` and stop

---

## Step 2 — Parse PR Input

From the slash command args, extract `workspace`, `repo`, `pr_id`:

**Full URL:** `https://bitbucket.org/{workspace}/{repo}/pull-requests/{id}`
→ parse directly with regex.

**PR number only:** Use current git remote to resolve workspace/repo:
```bash
git remote get-url origin
# e.g. git@bitbucket.org:xmdevint/cb-store.git → workspace=xmdevint, repo=cb-store
```

If still ambiguous → ask the user.

---

## Step 3 — Eligibility Check

```bash
curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}"
```

**Skip (do not review) if:**
- `state != "OPEN"` (closed or merged)
- `draft == true`
- Title contains "automated", "chore(deps)", or "Bump "
- PR already has a comment from the reviewer that starts with `### Code review`

Tell the user why you're skipping and stop.

---

## Step 4 — Fetch Diff + File List (parallel)

Run these **in parallel**:

```bash
# Changed files
curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}/diffstat?pagelen=100"

# Full diff → save to file for agent reuse
curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}/diff" \
  > /tmp/pr{id}.diff
```

PR description is already available from the eligibility check response.

---

## Step 5 — Find Relevant CLAUDE.md Files

Check for CLAUDE.md in:
- Repository root
- Each directory containing a modified file

Collect file paths — agents will reference these.

---

## Step 6 — Launch 5 Parallel Review Agents

**CRITICAL: Dispatch ALL 5 agents in a SINGLE message as parallel Agent tool calls.**

**Pre-flight:** Verify `feature-dev:code-reviewer` is available:
```bash
ls ~/.claude/skills/ | grep feature-dev
```
If missing: fall back to `general-purpose` subagent type with the same prompts.

Use `subagent_type: "feature-dev:code-reviewer"` and `model: "sonnet"`.

All agents read `/tmp/pr{id}.diff`. Give each agent the CLAUDE.md file paths.

### Agent 1 — CLAUDE.md Compliance
Check the diff against every CLAUDE.md found:
- Naming conventions (file names, exports, hooks, services, tests, constants)
- Architecture patterns (layered structure, server actions, state management)
- Code style (line length, formatter, linter rules)
- File organization patterns
Return each violation with file path and line number from the diff.

### Agent 2 — Bug Scan
Shallow scan for runtime bugs only — skip nitpicks:
- Null/undefined guards missing
- Async/await errors (missing await, unhandled promise)
- Logic errors (off-by-one, wrong condition, unreachable code)
- State mutation bugs
Return only issues that will actually break something.

### Agent 3 — Git History
For each modified file, run:
```bash
git log --oneline -10 -- {file}
```
Look for:
- Recent reverts of previous fixes that this PR re-introduces
- Patterns in commit messages that suggest the change conflicts with intent
- Repeated churn in the same area (fragile code)
Return findings with commit SHAs.

### Agent 4 — Code Comments
- TODOs or FIXMEs left unaddressed in changed lines
- New comments that inaccurately describe their code
- Misleading or stale comments introduced by this PR
Return comment text + file + line.

### Agent 5 — Prior PR Patterns
```bash
git log --oneline --merges --all -- {modified files} | head -20
```
Read the current state of modified files to find:
- Established conventions in the file that the PR violates
- Patterns other contributors use that the PR ignores
Return concrete examples (existing code vs PR code).

---

## Step 7 — Score Issues (parallel Haiku agents)

Dispatch **one Haiku agent per issue**, all in parallel. Each agent receives:
1. The issue description
2. The diff at `/tmp/pr{id}.diff`
3. Paths to CLAUDE.md files found in Step 5

**Scoring rubric (give verbatim to agents):**
```
0   = False positive / pre-existing issue not introduced by this PR
25  = Unverified, might be real; CLAUDE.md doesn't explicitly call it out
50  = Real but nitpick or rare in practice
75  = Verified real, important; or explicitly violates CLAUDE.md
100 = Certain, will cause a bug or violation that happens frequently
```

**Filter:** Keep only issues scored **≥ 70**. Silently drop everything below 70.

---

## Step 8 — Show Findings to User

If no issues ≥ 70: tell the user "No issues found" and ask if they still want to post a "no issues" comment. Stop here if they say no.

Otherwise display:

```
### Code review findings for PR #{id}

Found N issues:

| # | Confidence | Issue | File |
|---|------------|-------|------|
| 1 | 85 | **[title]** — [description] ([source: bug/CLAUDE.md/git history/comments/prior PRs]) | `path/file.ts` ~line X |
| 2 | 75 | **[title]** — [description] | `path/file.ts` ~line Y |

Which issues do you want to include in the PR comment?
Reply: "all", specific numbers like "1,2", or "none" to skip posting.
```

---

## Step 9 — Ask Permission

Use `AskUserQuestion` tool:

> "Which issues do you want to include in the PR comment? Reply 'all', specific numbers (e.g. '1,3'), or 'none' to skip posting."

- **"none"** → stop, do not post anything
- **specific numbers** → include only those issues
- **"all"** → include all ≥70 issues

---

## Step 10 — Post Comment

**Only post after explicit user approval in Step 9.**

First get the HEAD commit SHA for file links:
```bash
git rev-parse HEAD
```

Post the comment:
```bash
COMMENT_BODY=$(cat <<'EOF'
### Code review

Found N issues:

1. **[title]** — [description]

[`file.ts` lines X–Y](https://bitbucket.org/{workspace}/{repo}/src/{commit}/path/to/file.ts#lines-X:Y)

---
🤖 Generated with Jim's Megatron

*If this code review was useful, please give it a thumbs up.*
EOF
)

curl -X POST \
  -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}/comments" \
  -d "{\"content\": {\"raw\": $(echo "$COMMENT_BODY" | jq -Rs .)}}"
```

**File link format:** `https://bitbucket.org/{workspace}/{repo}/src/{commit}/path/to/file.ts#lines-X:Y`

### No Issues Comment Format

```markdown
### Code review

No issues found. Checked for bugs and CLAUDE.md compliance.

🤖 Generated with Jim's Megatron
```

---

## Auth Note

Always use `-u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN"` — **NOT** Bearer token auth. Bitbucket's REST API uses HTTP Basic auth with email + app password.
