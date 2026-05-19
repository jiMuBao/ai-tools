---
name: cb-npm-audit
description: Audit a specific npm package before installing. Use when the user asks to
  "audit a package", "check if X is safe to install", "is <package> compromised", or
  wants to inspect postinstall scripts/dependencies before running npm/pnpm/yarn install.
---

Audit the given npm package **without installing it**. Follow all 4 steps below.

## Step 1 — Resolve Package + Version

Parse the user's input for `<package>` and optional `<version>` (e.g. `axios`, `axios@1.14.1`).

If no version specified, resolve the latest:
```bash
npm info <package> version
```

## Step 2 — Inspect Registry Metadata

Fetch the package metadata from the npm registry without installing:
```bash
npm info <package>@<version> --json
```

Extract and evaluate:
- `scripts` — flag any `preinstall`, `install`, or `postinstall` entries
- `dependencies` — check each dep: run `npm info <dep> --json` to inspect publisher age and activity
- `maintainers` / `_npmUser` — check if the publisher is new or unexpected
- `dist.shasum` — note the checksum for integrity reference

**Red flags:**
| Signal | Severity |
|---|---|
| `postinstall` / `install` / `preinstall` script present | WARN — inspect the script |
| Script contains `curl`, `wget`, `powershell`, `exec`, `eval` | DANGER |
| Dependency never imported in source (e.g. only in `package.json`) | DANGER |
| Dependency published by a new/unknown account | WARN |
| No matching GitHub tag for this version | DANGER |

## Step 3 — Check GitHub Tag Alignment

Cross-check that a GitHub release or tag exists for the version:
```bash
npm info <package> repository.url
# Then verify: https://github.com/<owner>/<repo>/releases/tag/v<version>
```

If no tag exists → the version was pushed manually to npm, bypassing CI/CD. High risk.

## Step 4 — Scan Lockfiles for Existing Usage

Use `rg` to check if this package (or version) is already present in the project:
```bash
# Check for any version
rg "<package>" \
  --glob "**/package.json" \
  --glob "**/package-lock.json" \
  --glob "**/yarn.lock" \
  --glob "**/pnpm-lock.yaml"

# Check for a specific bad version
rg "<package>.*(X\.Y\.Z)" \
  --glob "**/package.json" \
  --glob "**/package-lock.json" \
  --glob "**/yarn.lock" \
  --glob "**/pnpm-lock.yaml"
```

## Step 5 — Report

Print a summary table then give a clear recommendation:

| Check | Result |
|---|---|
| Version audited | `<package>@<version>` |
| Install hooks | SAFE / WARN / DANGER |
| Suspicious dependencies | SAFE / WARN: `<dep>` |
| GitHub tag match | YES / NO |
| Already in lockfiles | NO / YES at `<version>` |

**Recommendation — pick one:**
- **Safe to install** — no hooks, deps look clean, tag exists
- **Install with `--ignore-scripts`** — hook exists but appears legitimate (e.g. native addon compilation)
- **Do not install** — malicious hook, missing tag, or suspicious dependency detected

If `--ignore-scripts` is recommended, show the exact command:
```bash
# npm
npm install <package> --ignore-scripts

# pnpm
pnpm add <package> --ignore-scripts

# yarn (no native flag — use .npmrc)
echo "ignore-scripts=true" >> .npmrc && yarn add <package>
```
