# ⚠️  DEPRECATED: This Makefile is deprecated. Please use the new CLI:
#    npx ai-tools deploy
# The CLI provides interactive selection, auto-detection, and better UX.
# Makefile support will be removed in a future version.

# Define a macro for prompted rsync with options to delete, keep, or cancel
define prompt_rsync
	@echo "Checking for custom files in $(2)..."
	@deletions=$$(rsync --dry-run --delete -av $(1) $(2) 2>/dev/null | grep '^deleting' || true); \
	if [ -n "$$deletions" ]; then \
		echo -e "\033[1;31m⚠️  Warning:\033[0m The following custom files in $(2) will be deleted:"; \
		echo -e "\033[33m$$deletions\033[0m"; \
		while true; do \
			read -p $$'\033[1mDelete existing files (y), Keep existing files (k), or Cancel (N): \033[0m' choice; \
			case "$$choice" in \
				y|Y) rsync --delete -av $(1) $(2); break ;; \
				k|K) rsync -av $(1) $(2); break ;; \
				n|N|"") echo -e "\033[1;31mAborted.\033[0m"; exit 1 ;; \
				*) echo -e "\033[1;31mInvalid choice. Please enter y, k, or N.\033[0m" ;; \
			esac; \
		done; \
	else \
		echo "No deletions detected. Syncing..."; \
		rsync --delete -av $(1) $(2); \
	fi
endef

deploy-skills:
	$(call prompt_rsync,skills/,~/.claude/skills/)
	$(call prompt_rsync,skills/,~/.config/opencode/skill/)
	$(call prompt_rsync,skills/,~/.gemini/skills/)

convert-gemini-commands:
	mkdir -p build/gemini-commands
	python scripts/convert_commands.py commands/ build/gemini-commands/

deploy-commands: convert-gemini-commands
	$(call prompt_rsync,commands/,~/.claude/commands/)
	$(call prompt_rsync,commands/,~/.opencode/command/)
	$(call prompt_rsync,build/gemini-commands/,~/.gemini/commands/)