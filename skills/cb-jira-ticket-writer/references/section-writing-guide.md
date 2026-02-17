# Section Writing Guide

This guide provides detailed instructions for writing each section of a Commercebuild Jira ticket.

## Summary

**Purpose**: One-line title that clearly indicates what the ticket is about

**Format**: `[Area][Component/Type] description`

**Examples:**

- `[REACT][V5][CMS] Icon Selectors`
- `[REACT][V5][CMS] break main navigation into smaller blocks`
- `[REACT][V5][CMS] reductant api call on page initial`

**Guidelines:**

- Be concise: 1-2 sentences maximum
- Include area: [REACT], [V5], [CMS], [API], etc.
- Include component name if applicable
- Include type indicator at the end: [feature], [bug], [improvement]
- Avoid generic descriptions like "Add feature" or "Fix bug"

## Description

**Purpose**: Comprehensive explanation of what was done, why it was done, and what it provides

### Structure by Ticket Type

#### Feature Ticket Structure

Use this structure:

```markdown
## Summary

[Concise title]

## Description

This feature adds [capability/component] to [area]. It enables [what merchants/users can do].

### Key Components Added:

**1. [Component Name]**

- Feature 1
- Feature 2
- Feature 3

**2. [Component Name]**

- Feature 1
- Feature 2

...

### Steps to Reproduce

1. Navigate to [location]
2. Perform [action]
3. Verify [outcome]
```

#### Bug Ticket Structure

Use this structure:

```markdown
## Summary

[Concise title]

## Description

**Bug Type:** [Performance/Functional/Critical/Minor]

**Background:**
[Brief context about the issue]

**Root Cause:**

- [Cause 1]
- [Cause 2]
- [Cause 3]

**Impact:**

- [Impact 1]
- [Impact 2]
- [Impact 3]

### Steps to Reproduce

1. [Action]
2. [Action]
3. [Action]
```

#### Improvement Ticket Structure

Use this structure:

```markdown
## Summary

[Concise title]

## Description

This [refactors/optimizes/improves] [area/component].

**Changes Made:**

- [Change 1]
- [Change 2]
- [Change 3]

**Benefits:**

- [Benefit 1]
- [Benefit 2]
```

### Writing Guidelines

- **Use imperative tense**: "Adds," "Fixes," "Refactors" (not "Added," "Fixed," "Refactored")
- **Be specific**: Name actual components, files, or services (not "some components")
- **Include technical details**: Dependencies, file paths, API endpoints when relevant
- **Focus on user/developer value**: What problem does this solve? What does this enable?
- **Organize with clear hierarchy**: Use `##` for sections, `###` for subsections, bullet points for items
- **Use bold for key terms**: `**Component Name**`, `**Impact:`, etc.

## Steps to Reproduce

**Purpose**: Clear, numbered instructions to reproduce or test the work

**Guidelines:**

- Number each step: `1.`, `2.`, `3.`
- Start each step with an action verb: "Navigate," "Click," "Enter," "Select"
- Include specific locations: "Theme Editor," "Store Admin," "Header Navigation block"
- Include specific field names: "Icon Type dropdown," "Custom Icon field," "Add Menu Item button"
- Be sequential: Each step should logically follow the previous one
- Cover key scenarios: Happy path, edge cases, error states
- Include verification step: Final step to confirm the expected behavior

**Example format:**

```markdown
1. Navigate to Theme Editor in Store Admin
2. Edit a header section that contains Navigation block
3. Add or edit "Icons" block
4. Click on "Icon Type" dropdown → select "custom"
5. Click on "Custom Icon" field → IconPicker opens
6. Test search by typing "heart"
```

## Expected vs Actual Outcomes

### Expected Outcome

**Purpose**: What should happen after the work is complete (for features) or what should have happened (for bugs)

**Guidelines:**

- Use bullet points for multiple outcomes
- Be specific: Include actual UI states, API behavior, or performance metrics
- Use present tense for what should happen
- Focus on user experience or system behavior
- Include technical details where relevant: API call counts, render timing, etc.

**Example:**

```markdown
- IconPicker opens and displays a grid of icons (7 columns)
- Search filters icons matching name or tags
- Selected icon is highlighted and displayed in button
- Dropdowns render correctly at runtime with hover triggers
```

### Actual Outcome

**Purpose**: What actually happened (for bugs) or what currently happens (for improvements being documented)

**Guidelines:**

- Leave blank for tester: `(Leave blank for tester)`
- Or document current buggy behavior
- Use past tense: "Multiple redundant API calls," "Header configuration fetched twice"
- Be specific: Include console log messages, network tab evidence, error messages
- Note severity indicators: "Console logs showing multiple... messages"

## Testing Checklist

**Purpose**: Comprehensive list of verification points for tester

### Organization Principles

- **Group by component/area**: Create subsections for each major component
- **Logical flow**: Test setup → component behavior → edge cases → integration
- **Checkbox format**: Use `[ ]` for unchecked items, `[x]` for checked (after completion)
- **Specific over generic**: "Can add icons (up to 10 max)" vs "Can add icons"

### Subsection Structure

```markdown
### [Component Name] Property Editor:

- [ ] Test point 1
- [ ] Test point 2

### [Component Name] Component:

- [ ] Test point 1
- [ ] Test point 2

### Runtime Behavior:

- [ ] Test point 1
- [ ] Test point 2

### Backward Compatibility:

- [ ] Test point 1
- [ ] Test point 2
```

### Writing Checklist Items

- Start with action verb: "Can add," "Search filters," "Drag-and-drop works"
- Be specific: Include exact field names, button labels, or component names
- Include UI state descriptions: "Shows with checkmark icon," "displays as disabled"
- Cover positive and negative cases: "Works when data present," "Shows error when unavailable"
- Include edge cases: "Max items limit enforced," "Fallback behavior when SSR data unavailable"
- Test integration points: "Page renders correctly with Icons block," "Multiple menu items display horizontally"

## Acceptance Criteria

**Purpose**: Specific, measurable criteria that define when the ticket is complete

**Guidelines:**

- Numbered list: `1.`, `2.`, `3.`
- Specific and measurable: Include concrete functionality or metrics
- Testable: Each criterion can be verified by a tester
- Use present tense or future tense: "Component renders," "API calls eliminated"
- Include checkbox markers: Use `✅` prefix for checked items (or `[x]`)

**Example format:**

```markdown
1. ✅ IconPicker property editor functional with search, category filtering, and selection
2. ✅ Icons block component renders presets (cart, account, language, search) and custom icons
3. ✅ Menu items support both custom URLs and category links
4. ✅ Redundant API calls eliminated on page load
5. ✅ Edit mode behavior unchanged
```

## Screenshots/Examples

**Purpose**: Visual or technical evidence to help testers understand what they're verifying

### UI Screenshots

Use for:

- Component/editor UI states
- Page layouts before/after changes
- Error states or validation messages

**Format:**

```markdown
### [UI Element] UI:

- Breadcrumb: "Root"
- List of top-level menu items with drag handles
- Each item shows: drag handle, delete button, expand chevron, label
```

### Network/Evidence Screenshots

Use for:

- Performance issues (Network tab showing duplicate API calls)
- Error states (Console logs, error messages)
- API responses

**Format:**

```markdown
### Before Fix (Network Tab):

- Multiple requests to `/api/cms/templates/by-type/header` on page load
- Headers show duplicate fetches with same timestamps

### After Fix (Network Tab):

- Single API request (if SSR data unavailable)
- Zero API requests when SSR data present
```

### Console Logs

Use for:

- Debugging evidence
- Performance logs
- Warning/error messages

**Format:**

```markdown
### Console Logs Comparison:

- Before: "📦 [Runtime] Loading header from CmsConfigurationManager" (multiple times)
- After: "📦 [Runtime] Using SSR data from context for header" (single)
```

## Related Issues

**Purpose**: Link to parent epics and related tickets for context

**Guidelines:**

- Parent Epic: Always link to the main epic (usually UN-2380 for CMS work)
- Related tickets: Link to tickets in same PR or same feature area
- Use proper format: `Parent Epic: UN-#### (Epic Name)`
- Bullet points for multiple related issues: Use `*` prefix

**Example:**

```markdown
### Related Issues

- Parent Epic: UN-2380 (V5 CMS Work Breakdown Epic)
- Related: UN-2611 (Icon Selectors - part of same PR)
```
