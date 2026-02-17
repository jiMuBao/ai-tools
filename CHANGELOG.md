# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- CB Jira ticket writer skill with templates and examples

### Changed
- Fix directory path references in agent configuration (skill→skills, command→commands)

## [1.0.0] - 2026-01-29

### Added
- Refactor-task skill for code refactoring guidance
- Video-downloader skill supporting TikTok, Douyin, Bilibili (1900+ platforms)
- Skills creator for building custom AI agent skills
- Git commit message generation skill with title support
- Command namespacing (subdirectories create colon-separated paths)

### Changed
- Modernized CLI banner with vercel-like style

## [0.2.0] - 2026-01-28

### Added
- Skills creator skill
- Git commit message generation skill with title support

## [0.1.0] - 2026-01-16

### Added
- Command deployment system for AI assistants
- Safe rsync with deletion warnings and command namespacing
- Rsync keep option to preserve custom files during deployment
- CLI interactive deployment wizard with agent auto-detection
- Support for 26+ AI agents (Claude, Cursor, Codex, Cline, Gemini, OpenCode, and more)

### Deprecated
- Makefile deployment method (migrated to CLI)

### Docs
- Add documentation section on commands and skills usage
- Add guidance on when to use slash commands versus skills
- Explain key differences between commands and skills
