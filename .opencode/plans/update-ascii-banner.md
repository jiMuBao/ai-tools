# Plan: Update ASCII Art Banner to Modern Style

## Overview
Update the CLI banner ASCII art from the current block style to a modern, clean block style with rounded corners.

## Current State
- File: `src/cli.ts`
- Location: Lines 32-39
- Current style: Traditional block characters (███████╗)

## Target State
Replace `LOGO_LINES` constant with modern style:

```typescript
const LOGO_LINES = [
  ' ███████╗██╗     ██╗ ███████╗███████╗',
  ' ██╔════╝██║     ██║ ██╔════╝██╔════╝',
  ' ███████╗██║     ██║ ███████╗███████╗',
  ' ╚════██║██║     ██║ ╚════██║╚════██║',
  ' ███████║███████╗██║ ███████║███████║',
  ' ╚══════╝╚══════╝╚═╝ ╚══════╝╚══════╝',
];
```

## Implementation Steps

1. **Update LOGO_LINES in src/cli.ts**
   - Replace lines 32-39 with new modern-style ASCII art
   - Maintain existing array structure and format

2. **Build the project**
   - Run `npm run build` to compile changes

3. **Test the banner**
   - Run `node bin/cli.mjs` to verify display
   - Check that colors and formatting still work correctly

## Changes Required

**File: src/cli.ts**
- Replace entire `LOGO_LINES` constant definition (lines 32-39)
- No other code changes needed

## Preview
When displayed, the banner will show:
```
 ███████╗██╗     ██╗ ███████╗███████╗
 ██╔════╝██║     ██║ ██╔════╝██╔════╝
 ███████╗██║     ██║ ███████╗███████╗
 ╚════██║██║     ██║ ╚════██║╚════██║
 ███████║███████╗██║ ███████║███████║
 ╚══════╝╚══════╝╚═╝ ╚══════╝╚══════╝
```

## Result
When users run `npx ai-tools` without arguments, they will see a modern, clean ASCII art banner with the new style.
