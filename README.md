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