# Define a macro for safe rsync with warning
define safe_rsync
	@echo "Checking for custom files in $(2)..."
	@deletions=$$(rsync --dry-run --delete -av $(1) $(2) 2>/dev/null | grep '^deleting' || true); \
	if [ -n "$$deletions" ]; then \
		echo -e "\033[1;31m⚠️  Warning:\033[0m The following custom files in $(2) will be deleted:"; \
		echo -e "\033[33m$$deletions\033[0m"; \
		read -p $$'\033[1mProceed with deletion? (y/N): \033[0m' confirm; \
		if [ "$$confirm" != "y" ] && [ "$$confirm" != "Y" ]; then \
			echo -e "\033[1;31mAborted.\033[0m"; \
			exit 1; \
		fi; \
	fi; \
	rsync --delete -av $(1) $(2)
endef

deploy-skills:
	$(call safe_rsync,skills/,~/.claude/skills/)
	$(call safe_rsync,skills/,~/.config/opencode/skill/)
	$(call safe_rsync,skills/,~/.gemini/skills/)

convert-gemini-commands:
	mkdir -p build/gemini-commands
	python scripts/convert_commands.py commands/ build/gemini-commands/

deploy-commands: convert-gemini-commands
	$(call safe_rsync,commands/,~/.claude/commands/)
	$(call safe_rsync,commands/,~/.opencode/command/)
	$(call safe_rsync,build/gemini-commands/,~/.gemini/commands/)