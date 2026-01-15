deploy-skills:
	rsync -av skills/ ~/.claude/skills/
	rsync -av skills/ ~/.config/opencode/skill/
	rsync -av skills/ ~/.gemini/skills/

convert-gemini-commands:
	mkdir -p build/gemini-commands
	python scripts/convert_commands.py commands/ build/gemini-commands/

deploy-commands: convert-gemini-commands
	rsync -av commands/ ~/.claude/commands/
	rsync -av commands/ ~/.opencode/command/
	rsync -av build/gemini-commands/ ~/.gemini/commands/