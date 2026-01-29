# AI Tools Deployment

This repository contains skills and commands for various AI assistants. Use the new AI Tools CLI to deploy skills and commands to your local AI assistant configurations.

## Prerequisites

- Node.js 20+ for the new CLI
- Python 3 with required packages: `toml` and `PyYAML` (install with `pip install toml PyYAML`) - for Gemini command conversion
- Skills and commands directories with their respective definitions

## Quick Start

```bash
# Install dependencies
npm install

# Build CLI
npm run build

# Run interactively (recommended)
npx ai-tools deploy

# List available items
npx ai-tools list

# Check status
npx ai-tools status
```

## CLI Commands

### deploy
Deploy skills and/or commands to AI agents.

```bash
# Interactive wizard (recommended)
ai-tools deploy

# Deploy everything to all agents (batch mode)
ai-tools deploy --all --yes

# Deploy to specific agents
ai-tools deploy --agent claude,cursor,opencode

# Deploy specific items
ai-tools deploy --skill git-commit-msg --command git/commit

# Local installs (instead of global)
ai-tools deploy --local
```

### list
List available skills and commands.

```bash
# List everything
ai-tools list

# List only skills
ai-tools list --skills

# List only commands
ai-tools list --commands

# Show installed agents
ai-tools list --installed
```

### status
Show deployment status and history.

```bash
ai-tools status
```

## Deployment Flow

### Interactive Mode

When running `ai-tools deploy` without flags, you'll be guided through:

1. **Select deployment type**: Skills, commands, or both
2. **Choose agents**: All detected, previous selection, or custom selection
3. **Pick items**: Select specific skills/commands to deploy
4. **Confirm deployment**: Review and confirm

The CLI remembers your last selections for quick reuse.

### Agent Support

The CLI supports 26+ AI agents including:

**Your installed agents (detected):**
- Claude (`~/.claude`)
- Cursor (`~/.cursor`)
- Codex (`~/.codex`)
- Cline (`~/.cline`)
- Gemini (`~/.gemini`)
- OpenCode (`~/.config/opencode`)

**Additional Vercel-supported agents:**
- Amp, Antigravity, Command Code, Continue, Crush, Droid, GitHub Copilot, Goose, Junie, Kilo Code, Kimi CLI, Kiro CLI, Kode, MCPJam, Moltbot, Roo, Rosie, Sweep, and more

### Deployment Paths

**Global installs (default):**
- Skills are copied to `~/.agents/skills/<skill>/` then symlinked to agent directories
- Commands are copied directly to agent command directories
- This saves disk space with centralized storage

**Project-local installs:**
- Skills/commands deployed to project-level agent directories
- Useful for project-specific configurations

## Migration from Makefile

**The Makefile is now deprecated.** Please migrate to the new CLI:

### Old (Makefile):
```bash
make deploy-skills
make deploy-commands
```

### New (CLI):
```bash
ai-tools deploy
```

The new CLI provides:
- ✅ Interactive selection wizard
- ✅ Agent auto-detection
- ✅ Memory of last selections
- ✅ Better error handling
- ✅ Progress feedback

**To continue using Makefile temporarily**, it's still available but will show a deprecation warning.

## Directory Structure

- `skills/` - Skill definitions in directory format (containing SKILL.md)
- `commands/` - Command definitions in Markdown format
- `scripts/` - Utility scripts for format conversion (e.g., `convert_commands.py`)
- `src/` - CLI source code
- `.ai-tools/` - CLI state and lock file (auto-generated)

## Commands and Skills

### When to Use Commands vs Skills

**Use slash commands when:**
- You want to control exactly when it runs
- The task has fixed steps
- Consistency matters more than flexibility
- You don't trust the AI to figure out when to apply it

**Use skills when:**
- Instructions only apply sometimes (not every conversation)
- You want to reduce bloat
- You're okay with the AI deciding relevance
- You want to share patterns across projects/teams
- You're mentally prepared to invoke them explicitly anyway

### Key Differences

- **Trigger Control** — Slash commands run when YOU invoke them; Skills run when the AI decides they're relevant
- **Context** — Slash commands take explicit arguments; Skills infer context from conversation
- **Token Cost** — Slash commands load fully every time; Skills lazy-load (only description initially)

## Slash Command Namespacing

Organize commands into subdirectories to create namespaced commands:

- **OpenCode**: `commands/git/commit.md` → `/git:commit`
- **Claude**: `commands/git/commit.md` → `/project:git:commit`
- **Gemini**: Commands auto-converted to TOML with subdirs preserved

**Tips:**
- Subdirs create colon-separated namespaces
- Test deployment with `ai-tools deploy` to ensure correct sync

## Development

```bash
# Run in dev mode
npm run dev

# Type check
npm run type-check

# Build
npm run build
```

## Troubleshooting

### Python not found for command conversion
Install Python 3 and required packages:
```bash
pip install toml PyYAML
```

### Symlink creation fails
The CLI falls back to copy mode automatically if symlinks aren't supported.

### Agents not detected
Ensure at least one AI agent is installed (Claude, Cursor, etc.)