deploy-skills:
	rsync -av skills/ ~/.claude/skills/
	rsync -av skills/ ~/.config/opencode/skill/
	rsync -av skills/ ~/.gemini/skills/