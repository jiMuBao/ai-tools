# AI Tools Deployment

This repository contains skills and commands for various AI assistants. Use the provided Makefile to deploy skills and commands to your local AI assistant configurations.

## Prerequisites

- `make` command-line tool
- `rsync` command-line tool
- Python 3 with required packages: `toml` and `PyYAML` (install with `pip install toml PyYAML`)
- Skills and commands directories with their respective definitions

## Usage

To deploy skills and commands to all configured AI assistants, run:

```bash
make deploy-skills
make deploy-commands
```

`make deploy-skills` will synchronize the contents of the `skills/` directory to:
- `~/.claude/skills/` (Claude/Anthropic assistant)
- `~/.config/opencode/skill/` (OpenCode assistant)
- `~/.gemini/skills/` (Google Gemini assistant)

`make deploy-commands` will first convert commands to assistant-specific formats, then synchronize to:
- `~/.claude/commands/` (Claude/Anthropic assistant)
- `~/.opencode/command/` (OpenCode assistant)
- `~/.gemini/commands/` (Google Gemini assistant)

The conversion process uses Python scripts to transform Markdown command files into formats compatible with each assistant. The `rsync` command preserves file permissions, timestamps, and only transfers changed files for efficiency.

## Directory Structure

- `skills/` - Skill definitions in SKILL.md format for direct deployment
- `commands/` - Command definitions in Markdown format that can be converted to various formats
- `scripts/` - Utility scripts for format conversion (e.g., `convert_commands.py`)
- `build/` - Generated command files in assistant-specific formats (e.g., TOML for Gemini)

## Commands and Skills

### When to Use Commands vs Skills

**Use slash commands when:**
- You want to control exactly when it runs
- The task has fixed steps
- Consistency matters more than flexibility
- You don't trust Claude to figure out when to apply it (wise)

**Use skills when:**
- Instructions only apply sometimes (not every conversation)
- You want to reduce CLAUDE.md bloat
- You're okay with Claude deciding relevance (optimistic)
- You want to share patterns across projects/teams
- You're mentally prepared to invoke them explicitly anyway

### Key Differences

- **Trigger Control** — Slash commands run when YOU invoke them; Skills run when Claude decides they're relevant
- **Context** — Slash commands take explicit arguments; Skills infer context from conversation
- **Token Cost** — Slash commands load fully every time; Skills lazy-load (only description initially)

## Slash Command Namespacing Tips

Organize your commands into subdirectories to create namespaced slash commands, improving organization and avoiding name conflicts. Each assistant handles namespacing slightly differently:

- **OpenCode**: Use subdirs for namespacing (e.g., `commands/git/commit.md` → `/git:commit`). Supports arguments (`$ARGUMENTS`), shell injection (`!`command``), file refs (`@file`), and YAML frontmatter for metadata like `description`, `agent`, and `model`.
- **Claude**: Similar to OpenCode (e.g., `commands/git/commit.md` → `/project:git:commit` for project commands or `/user:git:commit` for global). Use `~/.claude/commands/` for global commands. Supports Markdown with frontmatter.
- **Gemini**: Commands are converted to TOML with preserved subdirs (e.g., `commands/git/commit.md` → `git/commit.toml` → `/git:commit`). Supports `{{args}}` for arguments and `!{command}` for shell injection in prompts.

**Tips**:
- Subdirs create colon-separated namespaces (e.g., `commands/dev/build/deploy.md` → `/dev:build:deploy`).
- Commands can override built-ins if they share names.
- Test deployment with `make deploy-commands` to ensure subdirs sync correctly.