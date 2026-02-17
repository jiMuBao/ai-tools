# CB Jira Ticket Writer

This skill provides guidance for creating Commercebuild Jira tickets with consistent formatting based on established project patterns (UN-2611, UN-2565, UN-2623).

## When to Use This Skill

Use this skill when:

- Completing code implementation and need to create a Jira ticket
- Documenting features, bug fixes, or improvements
- Wanting to ensure ticket descriptions are consistent with existing Commercebuild standards
- Writing tickets as part of UN-2380 (V5 CMS Work Breakdown Epic) or related epics

## Ticket Creation Workflow

1. **Understand the changes**: Review commit(s), code changes, or implementation details
2. **Determine ticket type**: Feature, Bug, or Improvement
3. **Load appropriate template**: See [feature-template.md](references/feature-template.md) or [bug-template.md](references/bug-template.md)
4. **Fill sections**: Follow [Section Writing Guide](references/section-writing-guide.md)
5. **Review examples**: See existing tickets in references/ for pattern consistency
6. **Complete checklist**: Use [Ticket Completeness Checklist](#ticket-completeness-checklist) before submission
7. **Update Jira**: Use ticket API or UI to update the description

## Ticket Type Guidelines

### Feature Tickets

Use for:

- New functionality implementation
- Major component additions
- New CMS blocks or property editors
- New integration points

**Structure:**

- Summary: `[Area][Component] feature name`
- Description: Focus on what was built, components added, capabilities provided
- Steps to Reproduce: How to access/test the feature
- Testing Checklist: Organized by component/feature area
- Acceptance Criteria: Functional requirements implemented

### Bug Tickets

Use for:

- Fixing issues or errors
- Performance improvements (redundant API calls, slow loading, etc.)
- Unexpected behavior corrections

**Structure:**

- Summary: `[Area][Type] issue description`
- Description: Include Bug Type, Background, Root Cause, Impact
- Steps to Reproduce: How to trigger/reproduce the issue
- Actual Outcome: The buggy behavior
- Expected Outcome: What should happen after fix
- Testing Checklist: Verify fix resolves the issue
- Acceptance Criteria: Issue resolved, no regressions

### Improvement Tickets

Use for:

- Refactoring existing code
- Code quality improvements
- Performance optimizations
- Technical debt reduction

**Structure:**

- Summary: `[Area][Type] improvement description`
- Description: What changed and why it's an improvement
- Steps to Reproduce: How to verify the improvement
- Testing Checklist: Performance/quality metrics validated
- Acceptance Criteria: Improved metrics achieved

## Ticket Completeness Checklist

Before updating Jira, ensure:

- [ ] Summary is concise (1-2 sentences, includes area and type)
- [ ] Description includes all relevant sections (Background, Root Cause, Impact for bugs)
- [ ] Steps to Reproduce are clear and numbered
- [ ] Expected and Actual Outcomes are defined
- [ ] Testing Checklist covers all components/areas affected
- [ ] Acceptance Criteria are specific and measurable
- [ ] Screenshots/Examples section includes UI descriptions or network evidence
- [ ] Related Issues section includes parent epic and related tickets
- [ ] No placeholder text (no "Describe step 1" or "Describe expected outcome")
- [ ] Checkboxes use `[ ]` format (unchecked)
- [ ] Sections use proper heading levels (`##`, `###`, etc.)

## Section Writing Guide

See [section-writing-guide.md](references/section-writing-guide.md) for detailed instructions on writing each ticket section.

## Examples

See these examples for complete Commercebuild tickets:

- [UN-2611: Icon Selectors](references/un-2611-icon-selectors.md)
- [UN-2565: Menu Editor](references/un-2565-menu-editor.md)
- [UN-2623: Redundant API Calls](references/un-2623-redundant-api.md)

## Related Resources

- Parent Epic: UN-2380 (V5 CMS Work Breakdown Epic)
- Project docs: `/home/jimubao/Projects/cb/cb-store-cms`
