# AI Tools Deployment

This repository contains skills for various AI assistants. Use the provided Makefile to deploy skills to your local AI assistant configurations.

## Prerequisites

- `make` command-line tool
- `rsync` command-line tool
- Skills directory with skill definitions

## Usage

To deploy skills to all configured AI assistants, run:

```bash
make deploy-skills
```

This will synchronize the contents of the `skills/` directory to:
- `~/.claude/skills/` (Claude/Anthropic assistant)
- `~/.config/opencode/skill/` (OpenCode assistant)
- `~/.gemini/skills/` (Google Gemini assistant)

The `rsync` command preserves file permissions, timestamps, and only transfers changed files for efficiency.