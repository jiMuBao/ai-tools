---
name: cb-pr-review
description: Run an automated multi-agent code review on a Bitbucket pull request, scoring findings by confidence and posting a review comment after user approval. Use when the user types /cb-pr-review, asks to "review PR 123", "review this pull request", "code review this PR", or pastes a Bitbucket PR URL with intent to review. Accepts a PR number (resolved against current git remote) or a full Bitbucket Cloud PR URL. Requires BITBUCKET_USERNAME and BITBUCKET_TOKEN env vars. Does NOT list or browse PRs — for that, use cb-pr-list.
---

# cb-pr-review — Bitbucket PR Review

Runs parallel review agents on a Bitbucket PR, scores issues by confidence, shows findings, then asks permission before posting.

**Invocation:**
- `/cb-pr-review https://bitbucket.org/workspace/repo/pull-requests/123`
- `/cb-pr-review 136`

To discover PR numbers first (list open / merged / mine), use the `cb-pr-list` skill.

## Operating modes

The skill runs in one of two modes; detect at start:

**Interactive (default)** — a human is at the keyboard. Use `AskUserQuestion` for the post-permission step. The "no issues" outcome asks the user whether to post a "no issues" comment.

**Unattended** — running inside a routine / RemoteTrigger / cron sandbox with no user available. Triggers:
- env var `CB_PR_REVIEW_UNATTENDED=1`, OR
- invocation arg `--auto-post`, OR
- the calling agent explicitly stated "auto-post: yes" or equivalent in the prompt.

In unattended mode:
- Skip Step 9's `AskUserQuestion`; treat the answer as `"all"` (include every issue ≥70).
- Always post a comment — findings or "no issues" — so the state marker (see Step 3 / Step 10) lands and future fires can dedup. Never silently exit without posting.
- Print a one-line summary to stdout per PR: `[reviewed|skipped|error] <pr-id> <title>`.
  - `reviewed` — a comment was posted (either with findings or the no-issues variant). Both cases count as `reviewed` because both stamp the marker.
  - `skipped` — eligibility check filtered the PR out (closed, draft, dep-bot title, or marker SHA matched current HEAD_SHA). No comment posted.
  - `error` — something failed mid-flight (auth, API error, HEAD_SHA missing, etc.). No comment posted.

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
# (a) PR object — gives state, draft flag, title, head SHA at source.commit.hash
curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}"

# (b) PR comments — needed for the state-marker dedup below
curl -s -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}/comments?pagelen=100"
```

Capture `HEAD_SHA = source.commit.hash` from (a) — used in Steps 8 and 10.

**Skip (do not review) if:**
- `state != "OPEN"` (closed or merged)
- `draft == true`
- Title contains "automated", "chore(deps)", or "Bump "
- A prior comment contains `<!-- claude-review-state sha=<X> -->` where `<X>` equals `HEAD_SHA`. (Force-pushes change the head SHA, so a stale marker won't block re-review.)

Extract the marker like:
```bash
jq -r '.values[] | select(.deleted != true) | .content.raw // empty' comments.json \
  | grep -oE 'claude-review-state sha=[a-f0-9]{7,40}' | tail -1
```

The `select(.deleted != true)` ignores tombstoned comments (a deleted prior review shouldn't block re-review). The `{7,40}` length bound prevents matching coincidental short hex strings that aren't real commit SHAs.

**Design note on force-pushes:** each posted review carries its own marker for the SHA it reviewed. A PR that's been force-pushed N times will accumulate up to N review comments — by design, since each review honestly describes the code state it evaluated. The skill does not garbage-collect old comments.

Tell the user (or print to stdout, in unattended mode) why you're skipping and stop.

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

Enumerate directories containing modified files from the diffstat response:
```bash
jq -r '.values[].new.path' diffstat.json | xargs -n1 dirname | sort -u
```

Then check for `CLAUDE.md` in:
- Repository root
- Each directory enumerated above (and walk up to root if you want broader coverage)

Collect file paths — agents will reference these.

---

## Step 6 — Launch 5 Parallel Review Agents

**CRITICAL: Dispatch ALL 5 agents in a SINGLE message as parallel Agent tool calls.**

**Pre-flight: pick a subagent type.** Try in order, first available wins:

1. `pr-review-toolkit:code-reviewer` — present when the `pr-review-toolkit` plugin is installed (this is the routine-friendly path; the plan ships this plugin onto claude.ai).
2. `feature-dev:code-reviewer` — present in local Claude Code with the `feature-dev` plugin.
3. `general-purpose` — last resort, works everywhere.

Detection: dispatch the first name. If the Task tool returns an error containing "unknown subagent_type" or similar (the harness rejects unknown agent types with an explicit error, NOT with a list of installed alternatives — you must probe), catch it and retry with the next name in the list. Once one succeeds, cache it and reuse the same `subagent_type` for all 5 agents in this fire — do not re-probe per agent.

Use the resolved `subagent_type` and `model: "sonnet"` for every agent.

All agents read `/tmp/pr{id}.diff`. Give each agent the CLAUDE.md file paths.

**Precondition for Agents 3 and 5:** these agents shell out to `git log` and require **CWD inside a local clone of the target repo** (the one the PR is against — e.g. cb-store, not cb-pr-review's own repo). Verify with `git rev-parse --show-toplevel` before dispatching them and confirm the toplevel matches `{workspace}/{repo}` from Step 2.

- **Interactive:** if the user invoked the skill from outside the target repo, prompt them to `cd` in or skip the two agents.
- **Unattended (routine):** the sandbox CWD is the attached source repo (e.g. cb-pr-bot), NOT the target repo. Atlassian API tokens authenticate Bitbucket REST APIs but **do not authorize git clone over HTTPS** (Bitbucket's git endpoint needs an App Password or SSH key — separate auth from the REST token). Two options:
  1. **Skip Agents 3 and 5** in this fire. The remaining 3 agents (CLAUDE.md compliance, bug scan, comments) still produce useful findings. This is the default for the routine path.
  2. If a working git-clone auth is configured (App Password env var or SSH key in sandbox), clone the target repo into `/tmp/{repo}` and `cd` there before dispatching Agents 3 and 5.

Document in the run summary which agents were skipped and why.

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

If no issues ≥ 70:
- **Interactive:** tell the user "No issues found" and ask if they still want to post a "no issues" comment. Stop here if they say no.
- **Unattended:** post the no-issues comment automatically (Step 10) so the state marker lands. Skip the ask.

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

## Step 9 — Ask Permission (interactive only)

**Skip this step entirely in unattended mode** — proceed to Step 10 with the answer treated as `"all"`.

Interactive — use `AskUserQuestion`:

> "Which issues do you want to include in the PR comment? Reply 'all', specific numbers (e.g. '1,3'), or 'none' to skip posting."

- **"none"** → stop, do not post anything (skips Step 10 entirely; no marker landed, so the PR will be re-evaluated next time).
- **specific numbers** → include only those issues
- **"all"** → include all ≥70 issues

---

## Step 10 — Post Comment

In interactive mode, post only after explicit user approval in Step 9. In unattended mode, always post (findings or no-issues).

**Commit SHA for file links + state marker:** use `HEAD_SHA` captured from Step 3's `source.commit.hash` — that's the PR head, which is what file-link URLs and the marker must reference.

- **Interactive:** if `source.commit.hash` is absent (rare — typically only when the PR's source branch was deleted), fall back to `git rev-parse HEAD` only when CWD is a checkout of the PR branch.
- **Unattended:** if `source.commit.hash` is absent, abort this PR with the stdout line `[error] {id} HEAD_SHA unavailable from PR API` and continue with the next PR. **Do not guess from local git** — in the sandbox the CWD is the attached source repo, not the target PR branch, and a wrong marker SHA would permanently break dedup for this PR (every future fire would think it had been reviewed at the wrong SHA).

**Append the state marker** as the last line of every comment body so future fires can dedup:

```
<!-- claude-review-state sha=<HEAD_SHA> -->
```

### Findings comment

```bash
COMMENT_BODY=$(cat <<EOF
### Code review

Found N issues:

1. **[title]** — [description]

[\`file.ts\` lines X–Y](https://bitbucket.org/{workspace}/{repo}/src/${HEAD_SHA}/path/to/file.ts#lines-X:Y)

---
🤖 Generated with Jim's Megatron

*If this code review was useful, please give it a thumbs up.*

<!-- claude-review-state sha=${HEAD_SHA} -->
EOF
)

curl -X POST \
  -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{id}/comments" \
  -d "$(jq -nc --arg b "$COMMENT_BODY" '{content:{raw:$b}}')"
```

**File link format:** `https://bitbucket.org/{workspace}/{repo}/src/${HEAD_SHA}/path/to/file.ts#lines-X:Y`

### No-issues comment

```markdown
### Code review

No issues found. Checked for bugs and CLAUDE.md compliance.

🤖 Generated with Jim's Megatron

<!-- claude-review-state sha=${HEAD_SHA} -->
```

---

## Auth Note

Always use `-u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN"` — **NOT** Bearer token auth. Bitbucket's REST API uses HTTP Basic auth with email + app password.
