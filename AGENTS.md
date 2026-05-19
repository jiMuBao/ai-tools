# AI Tools CLI - Agent Guidelines

A TypeScript/Node.js CLI tool for deploying skills and commands to AI coding assistants (Claude, Cursor, Gemini, OpenCode, etc.).

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Build with obuild (outputs to dist/)
npm run type-check   # TypeScript check (tsc --noEmit)
npm run dev          # Run CLI in dev mode (node src/cli.ts via tsx)
```

**No test framework is currently configured.**

## Commands vs Skills

This repository manages two types of AI agent extensions:

### When to Use Commands
- User wants explicit control over when it runs (slash command invocation)
- Task has fixed, repeatable steps
- Consistency matters more than flexibility
- You want guaranteed execution

### When to Use Skills
- Instructions should only apply conditionally
- AI should decide when they're relevant
- Lazy-loading for token efficiency
- Sharing patterns across projects/teams

### Key Differences
- **Trigger**: Commands run when invoked; Skills load when AI decides relevant
- **Context**: Commands take explicit arguments; Skills infer from conversation
- **Token Cost**: Commands load fully; Skills lazy-load (description first)

### Namespacing
Subdirectories create colon-separated namespaces:
- `commands/git/commit.md` → `/git:commit` (OpenCode) or `/project:git:commit` (Claude)

## Code Style

### TypeScript Configuration
- Target: ESNext with ESNext modules
- Strict mode enabled with additional checks
- `verbatimModuleSyntax: true` - use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` - array access may be undefined
- No emit (build handled by obuild)

### Import Conventions
```typescript
// Type-only imports use 'type' keyword
import type { Skill, Command } from './types.ts'

// ESM with .ts extension for local files
import { discoverSkills } from './skills/index.ts'

// Named exports preferred over default exports
export async function discoverSkills(): Promise<Skill[]>

// External packages
import * as p from '@clack/prompts'
import pc from 'picocolors'
import { join, dirname } from 'path'
```

### Formatting
- Single quotes for strings
- No semicolons (project convention)
- 2-space indentation
- Trailing commas in multiline structures

### Naming Conventions
- **Files**: kebab-case (`deploy-impl.ts`, `lock.ts`)
- **Functions**: camelCase (`discoverSkills`, `parseDeployOptions`)
- **Types/Interfaces**: PascalCase (`AgentConfig`, `DeployOptions`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level (`LOCK_PATH`)
- **Private helpers**: Prefix with underscore or keep in same file

### Error Handling
```typescript
// Return result objects for operations that can fail
interface DeployResult {
  success: boolean
  path: string
  mode: 'symlink' | 'copy'
  error?: string
}

// Try-catch with fallbacks for non-critical operations
try {
  const content = await readFile(path, 'utf-8')
  return JSON.parse(content)
} catch {
  return createDefaultLock()
}

// Early returns for validation failures
if (!isPathSafe(basePath, targetPath)) {
  return { success: false, path: target, error: 'Path traversal detected' }
}

// Process exit for user cancellation / fatal errors
if (p.isCancel(selection)) {
  process.exit(1)
}
```

### Async Patterns
- Always use `async/await` (no raw promises)
- `Promise.all` for parallel operations
- `await` in loops is acceptable for sequential dependencies

### Type Definitions
- Centralized in `src/types.ts` for shared types
- Co-located with modules for local-only types
- Use `type` for object shapes, `interface` for contracts
- Union types for finite sets (`AgentType`, `'symlink' | 'copy'`)

## Project Structure

```
src/
  cli.ts           # Entry point, command routing
  types.ts         # Shared type definitions
  agents.ts        # Agent configurations and detection
  deploy-impl.ts   # Main deployment logic
  list.ts          # List/status commands
  lock.ts          # State persistence (~/.ai-tools/lock.json)
  utils.ts         # Shared utilities
  skills/
    index.ts       # Skill discovery
    installer.ts   # Skill deployment (symlink/copy)
  commands/
    index.ts       # Command discovery
    installer.ts   # Command deployment
    converter.ts   # Gemini TOML conversion (Python bridge)
skills/            # Skill definitions (SKILL.md format)
commands/          # Command definitions (Markdown)
scripts/           # Python utility scripts
```

## Development Workflow

1. **Make changes**: Edit TypeScript files in `src/`
2. **Type check**: Run `npm run type-check` to verify types
3. **Test manually**: Run `npm run dev -- <command>` to test CLI
4. **Build**: Run `npm run build` before committing

### Important Notes
- The CLI uses `tsx` for development (no compilation needed)
- Build outputs to `dist/` via obuild bundler
- Lock file stored at `~/.ai-tools/lock.json`
- Skills deploy to `~/.agents/skills/` then symlink to agent directories
- Python 3 required for Gemini command conversion (`pip install toml PyYAML`)

### Adding New Agents
1. Add type to `AgentType` in `src/types.ts`
2. Add config to `agents` object in `src/agents.ts`
3. Include `detectInstalled` function for auto-detection
