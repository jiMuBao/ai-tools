---
name: execute-with-opencode
description: Delegates an approved implementation plan to opencode for autonomous execution.
  Use when a plan is ready and the user asks to "execute with opencode", "let opencode implement this",
  "hand off to opencode", "run this plan with opencode", or similar. Invokes opencode's non-interactive
  run mode with the plan file attached.
---

# Execute with OpenCode

## Overview

Delegate an approved implementation plan to `opencode` for autonomous, non-interactive execution. OpenCode runs the plan file in headless mode with `opencode run`.

## Workflow

1. **Verify or write the plan file**
   - If a plan `.md` file already exists, note its path
   - If not, write the current plan to a `.md` file first using the `Write` tool

2. **Determine the project directory**
   - Default to the current working directory (`cwd`)

3. **Invoke opencode**

   ```bash
   ~/.opencode/bin/opencode run \
     "Implement the attached plan step by step. Follow all instructions in the plan file." \
     -f <plan-file> \
     --dir <project-dir>
   ```

4. **Report to the user** that opencode has been invoked and is running

## Notes

- The `-m` model flag is optional — omit unless the user specifies a model
- The `--dir` flag defaults to the current working directory
- If no plan file exists, use the `Write` tool to save the plan first, then invoke opencode
