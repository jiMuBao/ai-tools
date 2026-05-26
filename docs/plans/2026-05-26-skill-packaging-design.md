# Skill Packaging — Design

Date: 2026-05-26
Status: Approved, ready for implementation planning

## Problem

The installer deploys skills to local agent directories but has no way to produce a portable artifact for upload (to claude.ai's Skills UI) or for sharing (GitHub Releases, direct download). Users who want to publish a skill outside this repo have no path.

## Decisions

| Decision | Choice |
|---|---|
| Upload target | Single artifact that serves both claude.ai upload and generic share |
| Archive format | Zip with `SKILL.md` at the root, named `<name>.skill` |
| Manifest file | None (YAGNI; claude.ai reads `SKILL.md` frontmatter directly) |
| CLI surface | New `ai-tools package` subcommand |
| Scope | Skills only (commands deferred until a real upload target exists for them) |
| Output location | `build/skills/<name>.skill` (default), overridable via `--out` |
| Zip library | `archiver` npm package |
| Tests | Manual smoke test in PR description; no test framework added |

## Architecture

Mirrors the existing `deploy` module shape.

**New files**
- `src/package.ts` — re-export entry, parallels `src/deploy.ts:1`
- `src/package-impl.ts` — `parsePackageOptions()` + `runPackage()` orchestration
- `src/skills/packager.ts` — `packageSkill(skill: Skill, outDir: string): Promise<PackageResult>`

**Modified files**
- `src/cli.ts` — new `case "package":` in the verb switch
- `src/types.ts` — `PackageOptions`, `PackagePlan`, `PackageResult`
- `package.json` — add `archiver` and `@types/archiver`

**Reused, not duplicated**
- `discoverSkills()` from `src/skills/index.ts` (already handles nested category dirs and dedupes)
- Exclusion rules from `src/skills/installer.ts:60` (skip dotfiles + `node_modules`) — extract to a shared `shouldIncludeEntry()` helper consumed by both installer and packager
- `sanitizeName()` from `src/utils.ts` for archive filename
- `p.spinner()` and `p.multiselect` UI patterns from `deploy-impl.ts`

## CLI surface

```
ai-tools package                              # interactive picker
ai-tools package --skill git-commit-msg       # single skill
ai-tools package --skill a,b,c                # explicit list
ai-tools package --all                        # every discovered skill
ai-tools package --all --out ./release-out    # override output dir
ai-tools package --skill foo --yes            # non-interactive
```

Flag parsing follows the same conventions as `parseDeployOptions` (`src/deploy-impl.ts:11`).

**Interactive flow** (no `--skill` and no `--all`):
1. Multiselect skills from `discoverSkills()`
2. Show summary `Packaging N skills → <outDir>` and confirm
3. Write archives with a per-skill spinner
4. Print results, e.g. `✓ git-commit-msg → build/skills/git-commit-msg.skill (12.3 KB)`

**Stateless** — no lock-file integration. Packaging is an ad-hoc release action, not a recurring workflow; remembering selections would pollute `.ai-tools/lock.json` for no benefit.

## Archive contents

```
git-commit-msg.skill (zip)
├── SKILL.md
├── scripts/
│   └── helper.sh
└── references/
    └── template.md
```

- `SKILL.md` at the archive root (claude.ai requirement)
- Dotfiles excluded; `node_modules/` excluded (pruned at traversal time via `skip`, not just emission)
- Symlinks **not** followed (`follow: false`) — see status note below
- Subdirectory structure preserved verbatim
- Idempotent: overwrite any existing `<name>.skill` at the output path

**Status update 2026-05-26:** shipped with `follow: false` (symlinks archived as links, not dereferenced). `readdir-glob` (the engine archiver uses) does not expose a depth-limit option, so dereferencing would expose the packager to infinite-loop on symlink cycles. Deref support is deferred pending a depth-limited globber or explicit cycle detection. Current skills don't use symlinks, so impact is nil today.

## Pre-flight validation

Before opening the archive stream, `packageSkill` parses `SKILL.md` with `gray-matter` (already a dep) and requires a non-empty `description` field — claude.ai rejects skills missing it. Validation failure returns `PackageResult { success: false, error: '...' }` without writing anything.

## Error handling

| Condition | Behavior |
|---|---|
| Missing `description` in frontmatter | Skip this skill, continue batch |
| `SKILL.md` unreadable | Skip with the underlying fs error |
| Output directory not writable | Bail early before touching any skill |
| Archive write fails mid-stream | Delete partial `.skill`, fail that skill, continue |
| `--skill foo` where `foo` doesn't exist | Hard-fail with `Unknown skill: foo. Run 'ai-tools list --skills'.` |
| `archiver` warning event | Treat as failure for that skill |
| Symlink loop | Surface as per-skill failure (archiver depth-limited) |

Exit code: 0 if all succeed, 1 if any failed. Per-skill failures don't abort the batch — same shape as `executeDeployment` in `deploy-impl.ts:271`.

No retry, no resume. Packaging is fast and deterministic.

## Edge case — category directories

`skills/commercebuild/` is a category, not a skill (no `SKILL.md`). `discoverSkills` already descends into subdirectories (`src/skills/index.ts:48`) and returns a flat list. The packager consumes that flat list, so categories require no special handling.

## Testing strategy

No test framework exists in the repo today; this feature does not warrant introducing one.

**Manual smoke test** (documented in the PR description):
```bash
npm run build
node dist/cli.mjs package --skill git-commit-msg
unzip -l build/skills/git-commit-msg.skill        # SKILL.md at root, no nesting
node dist/cli.mjs package --all
ls build/skills/*.skill                            # one per discovered skill
node dist/cli.mjs package --skill nonexistent      # exit 1, clear error
```

**Round-trip check:** unzip a produced `.skill` to a temp dir and run `discoverSkills` against it — confirms the archive is structurally valid as a skill, not merely a valid zip.

**Type-checked invariants** via `npm run type-check`:
- `PackageResult` discriminated shape forces every path to return success+path or failure+error
- `Skill` from discovery is the only input — no untyped string paths flowing in

Unit tests for `archiver` edge cases (large files, deep nesting) are deferred until a real bug forces them. `archiver` itself is battle-tested.

## What this design deliberately omits

- Manifest file (`skill.json`) — no consumer needs it yet
- Command packaging — no upload target for commands today
- Lock-file integration for packaging selections — packaging is ad-hoc
- Automated tests / test framework — manual smoke test is sufficient at current scale
- Versioning, signing, checksums — handled by GitHub Releases when needed
