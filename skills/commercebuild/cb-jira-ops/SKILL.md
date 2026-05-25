---
name: cb-jira-ops
description: Create, read, search, and update Commercebuild Jira tickets. Use when the user asks to "create a jira ticket", "look up UN-XXXX", "search jira", "what's assigned to me", "transition <ticket> to in progress", "add a comment to <ticket>", "link <ticket> to <epic>", or any Jira CRUD/workflow operation. Also handles writing properly-formatted descriptions following Commercebuild templates (UN-2611, UN-2565, UN-2623 patterns).
---

# cb-jira-ops — Commercebuild Jira operations

CRUD + search + workflow for Commercebuild Jira tickets, with template-driven description authoring.

## Choosing the path: MCP first, shell fallback

Every operation has two paths:

1. **MCP tools** (`mcp__claude_ai_Atlassian__*`) — preferred. Already authed via the user's claude.ai Atlassian connection. Zero setup.
2. **Shell fallback** (`scripts/cb-jira-ops.sh`) — for environments without the Atlassian MCP server. Requires:
   - `ATLASSIAN_URL` (e.g. `https://commercebuild.atlassian.net`)
   - `ATLASSIAN_EMAIL`
   - `ATLASSIAN_API_TOKEN` (https://id.atlassian.com/manage-profile/security/api-tokens)

   `ATLASSIAN_API_TOKEN` and `BITBUCKET_TOKEN` (used by `cb-pr-list` / `cb-pr-review`) can be the same Atlassian API token value — both Bitbucket Cloud and Jira Cloud authenticate against it.

Detect MCP availability by checking whether `mcp__claude_ai_Atlassian__getJiraIssue` is callable. If not, use the script.

For the cloud ID needed by MCP calls, call `getAccessibleAtlassianResources` once and cache the result for the session.

---

## Operations

### 1. Create a ticket (template-driven)

This is the unique value-add — the skill drafts a well-formatted description following Commercebuild conventions, then creates the issue.

**Workflow:**

1. Understand the changes (review commit(s), code, or implementation details)
2. Determine type: Feature, Bug, or Improvement → see [Ticket Type Guidelines](#ticket-type-guidelines)
3. Load template: [feature-template.md](references/feature-template.md) or [bug-template.md](references/bug-template.md)
4. Fill sections per [section-writing-guide.md](references/section-writing-guide.md)
5. Compare against [Ticket Completeness Checklist](#ticket-completeness-checklist)
6. Show the user the drafted summary + description and ask for confirmation
7. Create the issue

**MCP call** (after user confirms):
```
mcp__claude_ai_Atlassian__createJiraIssue
  cloudId: <from getAccessibleAtlassianResources>
  projectKey: "UN"
  issueTypeName: "Task" | "Bug" | "Story"
  summary: "..."
  description: "..."   (Jira ADF or wiki markup as required)
```

If you don't know which issue types exist, call `getJiraProjectIssueTypesMetadata` first.

**Shell fallback:** the script doesn't do create — instead, render the description to stdout and ask the user to paste into the Jira UI. Reason: template-driven authoring is best done in conversation, not on the command line.

### 2. View / get a ticket

**MCP:** `mcp__claude_ai_Atlassian__getJiraIssue` with `cloudId` + `issueIdOrKey: "UN-2611"`.

**Shell fallback:**
```bash
bash ~/.claude/skills/cb-jira-ops/scripts/cb-jira-ops.sh get UN-2611
```

Returns: summary, status, assignee, reporter, type, priority, description, recent comments.

### 3. Search

**MCP:** `mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql` with `cloudId` + `jql: "..."`.

**Shell fallback:**
```bash
bash ~/.claude/skills/cb-jira-ops/scripts/cb-jira-ops.sh search '<jql>'
```

**Natural-language → JQL crib sheet:**

| Ask                                | JQL                                                                |
|------------------------------------|--------------------------------------------------------------------|
| "what's assigned to me"            | `assignee = currentUser() AND statusCategory != Done`              |
| "open bugs in UN-2380"             | `"Epic Link" = UN-2380 AND issuetype = Bug AND statusCategory != Done` |
| "recently updated"                 | `updated >= -7d ORDER BY updated DESC`                             |
| "my open PRs review tickets"       | `assignee = currentUser() AND status = "In Review"`                |
| "tickets I reported this sprint"   | `reporter = currentUser() AND sprint in openSprints()`             |

Show the JQL you used before listing results, so the user can refine.

### 4. Update operations

#### Edit fields (description, summary, assignee, priority…)

**MCP:** `mcp__claude_ai_Atlassian__editJiraIssue` with the field map.

**Shell fallback:** not implemented (use Jira UI or extend the script).

#### Transition status

**Step 1** — list available transitions for the issue (transition IDs differ per workflow):

- MCP: `mcp__claude_ai_Atlassian__getTransitionsForJiraIssue`
- Shell: `bash .../cb-jira-ops.sh transitions UN-2611`

**Step 2** — apply:

- MCP: `mcp__claude_ai_Atlassian__transitionJiraIssue` with `transitionId`
- Shell: `bash .../cb-jira-ops.sh transition UN-2611 <transition-id>`

Confirm with the user before transitioning anything they didn't explicitly request.

#### Add comment

- MCP: `mcp__claude_ai_Atlassian__addCommentToJiraIssue`
- Shell: `bash .../cb-jira-ops.sh comment UN-2611 "Comment body here"`

#### Link issues

- List available link types: `mcp__claude_ai_Atlassian__getIssueLinkTypes`
- Create link: `mcp__claude_ai_Atlassian__createIssueLink` (e.g. "blocks", "relates to", "is blocked by")
- Shell: not implemented.

---

## Ticket Type Guidelines

### Feature tickets

Use for: new functionality, major component additions, new CMS blocks, new integrations.

- Summary: `[Area][Component] feature name`
- Description: what was built, components added, capabilities provided
- Steps to Reproduce: how to access/test
- Testing Checklist: organized by component/feature area
- Acceptance Criteria: functional requirements

### Bug tickets

Use for: errors, incorrect behavior, performance regressions, redundant calls.

- Summary: `[Area][Type] issue description`
- Description: Bug Type, Background, Root Cause, Impact
- Steps to Reproduce
- Actual Outcome vs Expected Outcome
- Testing Checklist: verify fix + no regressions
- Acceptance Criteria

### Improvement tickets

Use for: refactors, code quality, perf optimization, tech debt.

- Summary: `[Area][Type] improvement description`
- Description: what changed, why it's an improvement
- Steps to Reproduce: how to verify
- Testing Checklist: perf/quality metrics
- Acceptance Criteria: improved metrics achieved

## Ticket Completeness Checklist

Before creating (or before posting an edit):

- [ ] Summary is concise (1–2 sentences, includes area and type)
- [ ] Description includes all relevant sections (Background, Root Cause, Impact for bugs)
- [ ] Steps to Reproduce are clear and numbered
- [ ] Expected and Actual Outcomes are defined
- [ ] Testing Checklist covers all components/areas affected
- [ ] Acceptance Criteria are specific and measurable
- [ ] Screenshots/Examples section includes UI descriptions or network evidence
- [ ] Related Issues section includes parent epic and related tickets
- [ ] No placeholder text
- [ ] Checkboxes use `[ ]` format
- [ ] Headings use proper levels (`##`, `###`)

## References

- Templates: [feature-template.md](references/feature-template.md), [bug-template.md](references/bug-template.md)
- Field-by-field writing rules: [section-writing-guide.md](references/section-writing-guide.md)
- Pattern examples: [UN-2611 Icon Selectors](references/un-2611-icon-selectors.md), [UN-2565 Menu Editor](references/un-2565-menu-editor.md), [UN-2623 Redundant API](references/un-2623-redundant-api.md)

## Related resources

- Parent Epic: **UN-2380** (V5 CMS Work Breakdown Epic)
- Project docs: `/home/jimubao/Projects/cb/cb-store-cms`
- Related skills:
  - `cb-pr-list` — list/inspect Bitbucket PRs (often the PR linked from a ticket)
  - `cb-pr-review` — review the PR linked from a Jira ticket
