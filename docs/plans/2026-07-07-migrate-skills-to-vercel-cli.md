# Plan: Migrate Skills to Vercel `skills` CLI

**Status:** Not started · **Created:** 2026-07-07 · **Owner:** jimubao

## Context

The `skills` CLI from [vercel-labs/skills](https://github.com/vercel-labs/skills) is now strictly
more capable than this repo's skills tooling for the **skills** side: 73 agents, `remove`/`update`/
`find`/`use`/`init`, skills.sh registry integration, multiple source formats, and an active team.

**Conclusion:** stop competing on skills. Migrate skills management to `npx skills`, and
**retain ai-tools only for slash commands** (which Vercel's CLI does not cover) plus
`.skill` packaging.

Reference command surface we're migrating to:
- `npx skills add <source> [-g] [-a agents...] [-s skills...] [--copy|--symlink] [-y|--all]`
- `npx skills list` · `npx skills remove` · `npx skills update` · `npx skills find` · `npx skills use` · `npx skills init`

## Goals

1. All skills (Vercel-authored, third-party, personal) managed by `npx skills`.
2. No conflict between old ai-tools symlinks and the new tool.
3. ai-tools repo shrinks to commands-only (+ optional `.skill` packaging).
4. Personal skills become installable via `npx skills add <github>/<repo>`.

## Non-goals

- Rewriting the commands half of ai-tools (it stays as-is).
- Publishing skills to skills.sh immediately (optional follow-up).

---

## Current state audit

### Source of truth (ai-tools scheme)
- Central store: `~/.agents/skills/<name>/` (real files)
- Per-agent: symlinks from `~/.claude/skills/`, `~/.cursor/skills/`, etc. → `../../.agents/skills/<name>`
- State: `~/.ai-tools/lock.json`

### Skill inventory in `~/.agents/skills/`

**Bucket A — Vercel-authored** (re-install from `vercel-labs/agent-skills`)
- [ ] frontend-design
- [ ] skill-creator
- [ ] web-design-guidelines
- [ ] vercel-react-best-practices
- [ ] prototype
- [ ] find-skills

**Bucket B — Third-party** (find each upstream repo, then `npx skills add owner/repo`)
- [ ] brainstorming
- [ ] writing-plans
- [ ] writing-skills
- [ ] write-a-skill
- [ ] grill-me
- [ ] grill-with-docs
- [ ] tdd
- [ ] test-driven-development
- [ ] systematic-debugging
- [ ] diagnose
- [ ] refactor-task
- [ ] handoff
- [ ] triage
- [ ] to-issues
- [ ] to-prd
- [ ] executing-plans
- [ ] using-git-worktrees
- [ ] using-superpowers
- [ ] receiving-code-review
- [ ] verification-before-completion
- [ ] improve-codebase-architecture
- [ ] finishing-a-development-branch
- [ ] dispatching-parallel-agents
- [ ] zoom-out

**Bucket C — Personal** (origin: this repo `skills/` + vendored)
- [ ] cb-jira-ops
- [ ] cb-npm-audit
- [ ] cb-pr-list
- [ ] cb-pr-review
- [ ] commercebuild/* (container for the 4 cb-* skills)
- [ ] git-commit-msg
- [ ] video-downloader
- [ ] bilibili-downloader
- [ ] video-watermark-remover
- [ ] execute-with-opencode
- [ ] setup-matt-pocock-skills
- [ ] caveman

### Repo-level `skills/` dirs (the publishable set)
`bilibili-downloader`, `commercebuild`, `execute-with-opencode`, `git-commit-msg`,
`refactor-task`, `video-downloader`, `video-watermark-remover`

### Commands (STAYS in ai-tools — do not migrate)
- `commands/git/` (commit) — confirmed in `lock.json` lastSelectedCommands

---

## Step-by-step

### Phase 0 — Prep & safety
- [ ] **P0.1** Backup the entire current skills tree:
      `cp -a ~/.agents ~/.agents.bak.$(date +%Y%m%d)`
- [ ] **P0.2** Snapshot current lock state: `cat ~/.ai-tools/lock.json > ~/ai-tools-lock-snapshot.json`
- [ ] **P0.3** Confirm Node 20+ and network access for `npx`.

### Phase 1 — Probe Vercel CLI behaviour
- [ ] **P1.1** `npx skills add vercel-labs/agent-skills --list` — confirm catalog & skill names.
- [ ] **P1.2** Install one throwaway skill globally, then inspect where its symlink points:
      `npx skills add vercel-labs/agent-skills -g -s frontend-design -y`
      `ls -la ~/.claude/skills/frontend-design`
      → **record the canonical path** Vercel uses (e.g. `~/.skills/`, `~/.local/share/skills/`, etc.)
      This determines whether leftover ai-tools symlinks will collide.
- [ ] **P1.3** Identify canonical source repos for Bucket B skills (search skills.sh / GitHub).
      Record `owner/repo` for each in the checklist above.

### Phase 2 — Re-install skills via Vercel CLI (global)
Run these with `-g`. Keep agent targeting explicit only if needed; default = all detected.
- [ ] **P2.1** Bucket A:
      ```
      npx skills add vercel-labs/agent-skills -g \
        -s frontend-design -s skill-creator -s web-design-guidelines \
        -s vercel-react-best-practices -s prototype -s find-skills -y
      ```
- [ ] **P2.2** Bucket B: one `npx skills add <owner>/<repo> -g -y` per identified source.
- [ ] **P2.3** Bucket C (personal) — **two sub-options, pick one**:
      - *Interim (local):* `npx skills add ./skills -g -y` from this repo.
      - *Preferred (published):* push `skills/` to a GitHub repo, then
        `npx skills add jimubao/<repo> -g -y`.
- [ ] **P2.4** Verify: `npx skills list -g` matches the inventory above (minus anything intentionally dropped).

### Phase 3 — Tear out the ai-tools skills layer
⚠️ Only after Phase 2 is verified. Keep `~/.agents.bak.*` until a full working week passes.
- [ ] **P3.1** Remove ai-tools-created symlinks across agent dirs:
      ```
      find ~/.claude ~/.cursor ~/.codex ~/.cline ~/.gemini ~/.config/opencode \
           -L -type l -lname '*\.agents/skills/*' -delete 2>/dev/null
      ```
      (Dry-run first: replace `-delete` with `-print`.)
- [ ] **P3.2** Remove ai-tools state: `rm -rf ~/.ai-tools`
- [ ] **P3.3** Remove old central store: `rm -rf ~/.agents/skills`
      (Leave `~/.agents/` itself if other tools use it.)
- [ ] **P3.4** Re-run `npx skills list -g` — confirm no skills went missing.

### Phase 4 — Reposition the ai-tools repo
- [ ] **P4.1** Update `README.md`: rebrand as a **commands** deployer.
      Remove or demote the skills deployment docs; point users to `npx skills`.
- [ ] **P4.2** Trim `src/`:
      - Keep: `commands/` discovery + installer + Gemini TOML converter, `.skill` packaging.
      - Remove or mark deprecated: `skills/index.ts`, `skills/installer.ts` skills paths.
- [ ] **P4.3** Decide fate of repo `skills/` dir:
      - Keep as a normal skills repo → publish to GitHub → consume via `npx skills add`.
      - Or move to a separate repo to keep ai-tools focused on commands.
- [ ] **P4.4** Update `package.json` description/keywords (drop generic "skills deploy" framing).
- [ ] **P4.5** `npm run type-check` and `npm run build` after trimming.

### Phase 5 (optional) — Publish to skills.sh
- [ ] **P5.1** Push personal skills repo to GitHub.
- [ ] **P5.2** Verify `npx skills find <name> --owner jimubao` resolves.
- [ ] **P5.3** Consider a skills.sh badge/listing for discoverability.

---

## Open questions to resolve before Phase 3

1. **Vercel canonical storage path** — fill in from P1.2. Determines cleanup safety.
2. **Bucket B upstream sources** — some may be `obra/superpowers`, others individual repos. Confirm licensing/attribution before re-installing.
3. **Where does `caveman` / `setup-matt-pocock-skills` come from?** Likely third-party — find source.
4. **Should `refactor-task` stay as a personal skill or be replaced** by an upstream version? It exists in both Bucket B (vendored) and repo `skills/`. Pick one source of truth.

## Rollback

If migration breaks something:
```
# Restore ai-tools-managed skills
rm -rf ~/.agents/skills && cp -a ~/.agents.bak.*/skills ~/.agents/skills
# Re-run ai-tools deploy to recreate symlinks
npm run dev -- deploy --all --yes
```

## Resume notes

- Start at **Phase 0 / Phase 1**. P1.2 is the linchpin — its finding drives all cleanup.
- The only part of this repo that *must* survive is `commands/` + the Gemini TOML bridge.
- Do **not** run `npx skills add` and `ai-tools deploy` against the same agent dir simultaneously.
