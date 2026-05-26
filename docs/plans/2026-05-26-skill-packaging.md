# Skill Packaging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an `ai-tools package` subcommand that produces `<name>.skill` zip archives (claude.ai-uploadable, generically shareable) from the `skills/` tree.

**Architecture:** New `package` verb mirroring the existing `deploy` module structure: thin re-export entry, an `*-impl.ts` orchestrating discovery/picker/output, and a `skills/packager.ts` primitive that zips one skill. Reuses `discoverSkills`, exclusion rules from the installer, and `gray-matter` for frontmatter validation. Output defaults to `build/skills/<name>.skill`.

**Tech Stack:** Node 20+, TypeScript, `archiver` (new), `@clack/prompts`, `gray-matter`, `picocolors`.

**Design reference:** [`2026-05-26-skill-packaging-design.md`](./2026-05-26-skill-packaging-design.md). Read it before starting — every architectural choice (no manifest, no test framework, skills-only, etc.) is documented there.

**Working directory:** `/home/jimubao/Projects/ai-tools`. Optionally create a worktree first (see @superpowers:using-git-worktrees); not required for a feature this small.

---

## Task 1: Add `archiver` dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` (auto)

**Step 1: Install runtime and type packages**

Run: `npm install --save archiver && npm install --save-dev @types/archiver`

Expected: `package.json` now lists `archiver` under `dependencies` and `@types/archiver` under `devDependencies`. `package-lock.json` updated.

**Step 2: Verify type-check still passes**

Run: `npm run type-check`

Expected: exit 0, no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add archiver for skill packaging"
```

---

## Task 2: Extract shared entry-exclusion helper

The installer at `src/skills/installer.ts:60-62` filters out dotfiles and `node_modules` while copying. The packager needs the exact same rule. DRY it now so both call sites stay in sync.

**Files:**
- Modify: `src/utils.ts` — add `shouldIncludeEntry`
- Modify: `src/skills/installer.ts:60-62` — use the new helper

**Step 1: Read the current installer filter**

Run: `grep -n "startsWith\|node_modules" src/skills/installer.ts`

Expected: shows line 62 with `!entry.name.startsWith('.') && entry.name !== 'node_modules'`.

**Step 2: Add helper to `src/utils.ts`**

Append this function (no JSDoc — name is self-documenting):

```typescript
export function shouldIncludeEntry(name: string): boolean {
  return !name.startsWith('.') && name !== 'node_modules';
}
```

**Step 3: Use the helper in the installer**

In `src/skills/installer.ts`:

- Add to the existing import from `../utils.ts`: `shouldIncludeEntry`
- Replace line 62's inline filter with: `.filter((entry) => shouldIncludeEntry(entry.name))`

**Step 4: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0.

**Step 5: Verify installer still works end-to-end**

Run: `npm run build && node dist/cli.mjs deploy --skill git-commit-msg --agent claude --yes`

Expected: `✓ Claude` line; symlink exists at `~/.claude/skills/git-commit-msg/SKILL.md`.

Verify: `ls -la ~/.claude/skills/git-commit-msg`

Expected: directory or symlink pointing to `~/.agents/skills/git-commit-msg/`.

**Step 6: Commit**

```bash
git add src/utils.ts src/skills/installer.ts
git commit -m "refactor(skills): extract shouldIncludeEntry for reuse"
```

---

## Task 3: Add packaging types

**Files:**
- Modify: `src/types.ts` (append at end)

**Step 1: Append the three new interfaces**

```typescript
export interface PackageOptions {
  skills: string[];        // ['*'] means all
  out: string;             // resolved absolute path
  yes: boolean;
}

export interface PackagePlan {
  skills: Skill[];
  out: string;
}

export interface PackageResult {
  success: boolean;
  skill: string;
  path: string;            // archive path on success, attempted path on failure
  bytes?: number;          // archive size on success
  error?: string;
}
```

**Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0.

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add PackageOptions/Plan/Result"
```

---

## Task 4: Implement `packageSkill` primitive

**Files:**
- Create: `src/skills/packager.ts`

**Step 1: Write the module**

```typescript
import { createWriteStream } from 'fs';
import { mkdir, readFile, rm, stat } from 'fs/promises';
import { join, resolve } from 'path';
import archiver from 'archiver';
import matter from 'gray-matter';
import type { Skill, PackageResult } from '../types.ts';
import { isPathSafe, sanitizeName, shouldIncludeEntry } from '../utils.ts';

async function validateFrontmatter(skillPath: string): Promise<string | undefined> {
  try {
    const content = await readFile(join(skillPath, 'SKILL.md'), 'utf-8');
    const { data } = matter(content);
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    if (!description) {
      return 'missing description in SKILL.md frontmatter';
    }
  } catch (err) {
    return `cannot read SKILL.md: ${err instanceof Error ? err.message : 'unknown error'}`;
  }
  return undefined;
}

export async function packageSkill(skill: Skill, outDir: string): Promise<PackageResult> {
  const archiveName = `${sanitizeName(skill.name)}.skill`;
  const archivePath = resolve(outDir, archiveName);

  if (!isPathSafe(resolve(outDir), archivePath)) {
    return {
      success: false,
      skill: skill.name,
      path: archivePath,
      error: 'invalid skill name: potential path traversal detected',
    };
  }

  const validationError = await validateFrontmatter(skill.path);
  if (validationError) {
    return { success: false, skill: skill.name, path: archivePath, error: validationError };
  }

  try {
    await mkdir(outDir, { recursive: true });
    await rm(archivePath, { force: true });
  } catch (err) {
    return {
      success: false,
      skill: skill.name,
      path: archivePath,
      error: `cannot prepare output: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }

  return new Promise<PackageResult>((resolvePromise) => {
    const output = createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let failed = false;

    const fail = async (error: string) => {
      if (failed) return;
      failed = true;
      archive.removeAllListeners();
      try { archive.abort(); } catch { /* ignore */ }
      try { await rm(archivePath, { force: true }); } catch { /* ignore */ }
      resolvePromise({ success: false, skill: skill.name, path: archivePath, error });
    };

    output.on('error', (err) => { void fail(err.message); });
    archive.on('error', (err) => { void fail(err.message); });
    archive.on('warning', (err) => { void fail(err.message); });

    output.on('close', async () => {
      if (failed) return;
      try {
        const { size } = await stat(archivePath);
        resolvePromise({
          success: true,
          skill: skill.name,
          path: archivePath,
          bytes: size,
        });
      } catch (err) {
        void fail(err instanceof Error ? err.message : 'unknown error');
      }
    });

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: skill.path,
      dot: false,
      follow: true,
      ignore: ['node_modules/**', '.*', '**/.*'],
    });

    void archive.finalize();
  });
}
```

Note: `archive.glob` honors the `ignore` pattern; we keep `shouldIncludeEntry` imported because future callers (and the round-trip check) may want it, and removing it would cost a re-import later. *Reconsider:* if you don't end up using the import, remove it before committing.

**Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0. If `shouldIncludeEntry` is unused, remove the import — `noUnusedLocals` is off in tsconfig but cleanliness still matters.

**Step 3: Commit**

```bash
git add src/skills/packager.ts
git commit -m "feat(skills): add packageSkill primitive"
```

---

## Task 5: Implement `package-impl.ts` orchestration

**Files:**
- Create: `src/package-impl.ts`

**Step 1: Write the module**

```typescript
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { resolve } from 'path';
import type { PackageOptions, PackagePlan, Skill } from './types.ts';
import { discoverSkills } from './skills/index.ts';
import { packageSkill } from './skills/packager.ts';
import { getProjectRoot } from './utils.ts';

const DEFAULT_OUT_SUBDIR = 'build/skills';

export function parsePackageOptions(args: string[]): PackageOptions {
  const options: PackageOptions = {
    skills: [],
    out: resolve(getProjectRoot(), DEFAULT_OUT_SUBDIR),
    yes: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.skills = ['*'];
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--skill') {
      options.skills = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--out') {
      options.out = resolve(args[++i] || DEFAULT_OUT_SUBDIR);
    }
  }

  return options;
}

function multiselect<Value>(opts: {
  message: string;
  options: Array<{ value: Value; label: string; hint?: string }>;
}) {
  return p.multiselect({
    ...opts,
    options: opts.options as p.Option<Value>[],
    message: `${opts.message} ${pc.dim('(space to toggle)')}`,
  }) as Promise<Value[] | symbol>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function selectSkills(
  options: PackageOptions,
  available: Skill[]
): Promise<Skill[]> {
  if (options.skills[0] === '*') {
    return available;
  }

  if (options.skills.length > 0) {
    const byName = new Map(available.map((s) => [s.name, s]));
    const resolved: Skill[] = [];
    const unknown: string[] = [];
    for (const name of options.skills) {
      const match = byName.get(name);
      if (match) resolved.push(match);
      else unknown.push(name);
    }
    if (unknown.length > 0) {
      throw new Error(
        `Unknown skill(s): ${unknown.join(', ')}. Run 'ai-tools list --skills'.`
      );
    }
    return resolved;
  }

  const selected = await multiselect({
    message: 'Select skills to package',
    options: available.map((s) => ({
      value: s,
      label: s.name,
      hint: s.description || '',
    })),
  });

  if (p.isCancel(selected)) process.exit(1);
  return selected as Skill[];
}

export async function runPackage(options: PackageOptions): Promise<void> {
  p.intro(pc.cyan('AI Tools Package'));

  const available = await discoverSkills();
  if (available.length === 0) {
    p.note('No skills discovered in skills/.');
    p.outro('Nothing to package');
    process.exit(0);
  }

  const skills = await selectSkills(options, available);
  if (skills.length === 0) {
    p.outro('No skills selected');
    process.exit(0);
  }

  const plan: PackagePlan = { skills, out: options.out };

  if (!options.yes && options.skills.length === 0) {
    const confirm = await p.confirm({
      message: `Package ${skills.length} skill(s) → ${plan.out}?`,
    });
    if (p.isCancel(confirm) || !confirm) {
      p.outro('Cancelled');
      process.exit(0);
    }
  }

  let succeeded = 0;
  let failed = 0;

  for (const skill of plan.skills) {
    const spinner = p.spinner();
    spinner.start(`Packaging ${skill.name}...`);
    const result = await packageSkill(skill, plan.out);
    if (result.success) {
      succeeded++;
      spinner.stop(
        `${pc.green('✓')} ${skill.name} → ${result.path} ${pc.dim(`(${formatBytes(result.bytes ?? 0)})`)}`
      );
    } else {
      failed++;
      spinner.stop(`${pc.red('✗')} ${skill.name}: ${result.error}`);
    }
  }

  if (failed > 0) {
    p.outro(`${succeeded} packaged, ${failed} failed`);
    process.exit(1);
  }

  p.outro(`${pc.green('✓')} Packaged ${succeeded} skill(s) → ${plan.out}`);
}
```

**Step 2: Verify type-check passes**

Run: `npm run type-check`

Expected: exit 0.

**Step 3: Commit**

```bash
git add src/package-impl.ts
git commit -m "feat(package): add package orchestration (parse + run)"
```

---

## Task 6: Create `package.ts` re-export and wire CLI verb

**Files:**
- Create: `src/package.ts`
- Modify: `src/cli.ts` (add import + switch case + banner line)

**Step 1: Create the re-export entry**

`src/package.ts`:

```typescript
export { runPackage, parsePackageOptions } from './package-impl.ts';
```

**Step 2: Wire `cli.ts`**

In `src/cli.ts`:

- Add import alongside the existing deploy import (around line 7):
  ```typescript
  import { runPackage, parsePackageOptions } from "./package-impl.ts";
  ```
- Add a new case in the `switch (command)` block, after the `status` case:
  ```typescript
  case "package":
  case "p": {
    const options = parsePackageOptions(restArgs);
    await runPackage(options);
    break;
  }
  ```
- Add a banner line under the `Commands:` block in `showBanner()`:
  ```typescript
  console.log(`  ${TEXT}package${RESET}   Package skills as .skill archives`);
  ```

**Step 3: Type-check**

Run: `npm run type-check`

Expected: exit 0.

**Step 4: Build the CLI**

Run: `npm run build`

Expected: `dist/cli.mjs` updated, no errors.

**Step 5: Smoke-test the verb is wired**

Run: `node dist/cli.mjs --help`

Expected: output includes a `package` line under `Commands:`.

**Step 6: Commit**

```bash
git add src/package.ts src/cli.ts
git commit -m "feat(cli): wire 'ai-tools package' subcommand"
```

---

## Task 7: End-to-end smoke test

The design called for a manual round-trip. Run it now and fix anything that breaks.

**Files:** none (verification only)

**Step 1: Single-skill package**

Run: `node dist/cli.mjs package --skill git-commit-msg --yes`

Expected: `✓ git-commit-msg → /home/jimubao/Projects/ai-tools/build/skills/git-commit-msg.skill (... KB)`

**Step 2: Inspect the archive layout**

Run: `unzip -l build/skills/git-commit-msg.skill`

Expected: `SKILL.md` listed at the archive root (no parent directory prefix).

**Step 3: Round-trip check** — unzip into a temp dir and re-discover

```bash
rm -rf /tmp/skill-rt && mkdir -p /tmp/skill-rt/skills/git-commit-msg
unzip -q build/skills/git-commit-msg.skill -d /tmp/skill-rt/skills/git-commit-msg
ls /tmp/skill-rt/skills/git-commit-msg/SKILL.md
```

Expected: the `SKILL.md` path resolves. (Re-running `discoverSkills` against this tree would also work but requires a tiny one-liner Node script — skip unless something looks off.)

**Step 4: Package all skills**

Run: `node dist/cli.mjs package --all --yes`

Expected: one `✓` line per skill in `skills/` (count matches `find skills -name SKILL.md | wc -l`). Final summary: `✓ Packaged N skill(s)`.

Verify count: `ls build/skills/*.skill | wc -l` should equal the SKILL.md count.

**Step 5: Unknown-skill error path**

Run: `node dist/cli.mjs package --skill does-not-exist --yes`

Expected: non-zero exit, message contains `Unknown skill(s): does-not-exist`.

**Step 6: Missing-description failure path** — temporarily break a skill

```bash
cp skills/git-commit-msg/SKILL.md /tmp/SKILL.md.bak
# Edit skills/git-commit-msg/SKILL.md and remove the `description:` line from frontmatter
node dist/cli.mjs package --skill git-commit-msg --yes
# Expected: '✗ git-commit-msg: missing description in SKILL.md frontmatter', exit 1
mv /tmp/SKILL.md.bak skills/git-commit-msg/SKILL.md
```

Expected: the failure case fires; restoration returns the repo to a clean state. Confirm with `git status` showing no diff.

**Step 7: Custom `--out` directory**

Run: `node dist/cli.mjs package --skill git-commit-msg --out /tmp/skill-out --yes`

Verify: `/tmp/skill-out/git-commit-msg.skill` exists.

Cleanup: `rm -rf /tmp/skill-out /tmp/skill-rt`

**Step 8: No commit needed** — verification step only. If any step failed, fix the root cause and re-run before proceeding.

---

## Task 8: Document the new verb

**Files:**
- Modify: `README.md`

**Step 1: Add a `### package` section under `## CLI Commands`**

Insert after the `### status` section. Match the existing prose style:

```markdown
### package
Package skills as `.skill` archives for upload to claude.ai's Skills UI or generic sharing.

```bash
# Interactive picker
ai-tools package

# Specific skill(s)
ai-tools package --skill git-commit-msg
ai-tools package --skill a,b,c

# Everything
ai-tools package --all

# Custom output directory (default: build/skills/)
ai-tools package --all --out ./release-artifacts
```

Archives are `<name>.skill` files — zip archives with `SKILL.md` at the root, suitable for upload to claude.ai or distribution via GitHub Releases.
```

**Step 2: Update the `Quick Start` example list to mention `package`** (one line under the existing `ai-tools list` example):

```bash
# Package skills for upload/share
npx ai-tools package --all
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): document 'ai-tools package' verb"
```

---

## Done criteria

- `ai-tools package --skill <name>` produces a valid zip at `build/skills/<name>.skill` with `SKILL.md` at the root.
- `ai-tools package --all` packages every discovered skill; per-skill failures don't abort the batch.
- Missing `description` frontmatter fails that skill with a clear error and exit code 1.
- Unknown skill names hard-fail before any work.
- `npm run type-check` passes.
- README documents the new verb.
- All commits are scoped and atomic (one task per commit).
