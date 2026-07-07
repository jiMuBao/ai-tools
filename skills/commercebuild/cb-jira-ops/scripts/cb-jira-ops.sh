#!/usr/bin/env bash
#
# cb-jira-ops — minimal shell fallback for Commercebuild Jira ops.
# Use when the Atlassian MCP server is unavailable in the host AI agent.
# Auths with $ATLASSIAN_EMAIL / $ATLASSIAN_API_TOKEN against $ATLASSIAN_URL.
# Default site for Commercebuild: https://xmdevelopmentsintl.atlassian.net

set -euo pipefail

die() { echo "cb-jira-ops: $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage:
  cb-jira-ops get <KEY>
      Show summary, status, assignee, type, priority, description, last 5 comments.

  cb-jira-ops search '<JQL>'
      Run a JQL query. Returns key, status, summary (50 max).

  cb-jira-ops transitions <KEY>
      List available transitions (id + name) for the issue's current workflow state.

  cb-jira-ops transition <KEY> <transition-id>
      Apply a transition. Get the id from `transitions` first.

  cb-jira-ops comment <KEY> <body>
      Add a comment. Body may be plain text or wiki markup.

  cb-jira-ops create <project-key> <type> "<summary>" <description-file.md>
      Create an issue. Description file is Markdown (converted to ADF by
      scripts/md2adf.py — headings, lists, fenced code, **bold** / `code` /
      italic). Requires python3. Prints the new key + browse URL.

Environment:
  ATLASSIAN_URL          e.g. https://xmdevelopmentsintl.atlassian.net
  ATLASSIAN_EMAIL        login email
  ATLASSIAN_API_TOKEN    https://id.atlassian.com/manage-profile/security/api-tokens

Notes:
  Edit-fields and link ops are not in this fallback — use MCP or the Jira UI.
  Create IS supported here (markdown description -> ADF), so the fallback can
  create tickets without the Atlassian MCP server.
EOF
}

# --- env + tools ---
: "${ATLASSIAN_URL:?cb-jira-ops: ATLASSIAN_URL is not set}"
: "${ATLASSIAN_EMAIL:?cb-jira-ops: ATLASSIAN_EMAIL is not set}"
: "${ATLASSIAN_API_TOKEN:?cb-jira-ops: ATLASSIAN_API_TOKEN is not set}"
command -v jq >/dev/null 2>&1 || die "jq not found in PATH"
command -v curl >/dev/null 2>&1 || die "curl not found in PATH"
# python3 is only required for `create`; checked lazily in cmd_create.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

BASE="${ATLASSIAN_URL%/}/rest/api/3"
AUTH=( -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" )

api() {
  # api <METHOD> <PATH> [curl-args...]
  local method=$1 path=$2; shift 2
  curl -sS -X "$method" "${AUTH[@]}" \
    -H 'Accept: application/json' \
    -H 'Content-Type: application/json' \
    "$BASE$path" "$@"
}

# Atlassian Document Format → plain text (best-effort).
adf_to_text() {
  jq -r '
    def walk: (.. | objects | select(.type == "text") | .text);
    if type == "object" and .content then [walk] | join("") else (. // "") | tostring end
  '
}

cmd_get() {
  local key=$1
  local resp
  resp=$(api GET "/issue/$key?fields=summary,status,assignee,reporter,issuetype,priority,description,comment")
  if [[ $(echo "$resp" | jq -r '.errorMessages // empty | type') == "array" ]]; then
    die "$(echo "$resp" | jq -r '.errorMessages[]')"
  fi

  echo "$resp" | jq -r '
    "Key:       " + .key,
    "Type:      " + (.fields.issuetype.name // "?"),
    "Status:    " + (.fields.status.name // "?"),
    "Priority:  " + (.fields.priority.name // "?"),
    "Assignee:  " + (.fields.assignee.displayName // "Unassigned"),
    "Reporter:  " + (.fields.reporter.displayName // "?"),
    "Summary:   " + (.fields.summary // ""),
    ""
  '

  echo "Description:"
  echo "$resp" | jq '.fields.description' | adf_to_text
  echo ""

  echo "Recent comments:"
  echo "$resp" | jq -c '.fields.comment.comments // [] | sort_by(.created) | .[-5:] | .[]' | while read -r c; do
    author=$(echo "$c" | jq -r '.author.displayName // "?"')
    created=$(echo "$c" | jq -r '.created // ""')
    echo "  --- $author @ $created ---"
    echo "$c" | jq '.body' | adf_to_text | sed 's/^/    /'
  done
}

cmd_search() {
  # Uses the /search/jql endpoint (legacy POST /search was deprecated by Atlassian).
  # nextPageToken-based pagination; first page omits the token.
  local jql=$1
  local resp
  resp=$(api POST /search/jql \
    --data "$(jq -nc --arg j "$jql" '{jql:$j, maxResults:50, fields:["summary","status"]}')")
  if [[ $(echo "$resp" | jq -r '.errorMessages // empty | type') == "array" ]]; then
    die "$(echo "$resp" | jq -r '.errorMessages[]')"
  fi
  printf '%-12s %-20s %s\n' KEY STATUS SUMMARY
  echo "$resp" | jq -r '.issues[] | [.key, .fields.status.name, .fields.summary] | @tsv' | \
    awk -F'\t' '{ printf "%-12s %-20s %s\n", $1, $2, $3 }'
  if [[ $(echo "$resp" | jq -r '.isLast // true') == "false" ]]; then
    echo "  (more results available — pagination via nextPageToken not implemented in fallback)" >&2
  fi
}

cmd_transitions() {
  local key=$1
  local resp
  resp=$(api GET "/issue/$key/transitions")
  printf '%-6s %s\n' ID NAME
  echo "$resp" | jq -r '.transitions[] | [.id, .name] | @tsv' | \
    awk -F'\t' '{ printf "%-6s %s\n", $1, $2 }'
}

cmd_transition() {
  local key=$1 tid=$2
  local resp
  resp=$(api POST "/issue/$key/transitions" \
    --data "$(jq -nc --arg id "$tid" '{transition:{id:$id}}')")
  if [[ -n "$resp" ]]; then
    echo "$resp" | jq -r '.errorMessages // empty | .[]' >&2
    [[ $(echo "$resp" | jq -r '.errorMessages // empty | length') -gt 0 ]] && exit 1
  fi
  echo "Transitioned $key (id $tid)."
}

cmd_comment() {
  local key=$1 body=$2
  local payload
  payload=$(jq -nc --arg b "$body" '{
    body: {
      type: "doc",
      version: 1,
      content: [{ type: "paragraph", content: [{ type: "text", text: $b }] }]
    }
  }')
  local resp
  resp=$(api POST "/issue/$key/comment" --data "$payload")
  if [[ $(echo "$resp" | jq -r '.errorMessages // empty | type') == "array" ]]; then
    die "$(echo "$resp" | jq -r '.errorMessages[]')"
  fi
  echo "Comment added to $key (id $(echo "$resp" | jq -r '.id'))."
}

cmd_create() {
  local project=$1 itype=$2 summary=$3 descfile=$4
  command -v python3 >/dev/null 2>&1 || die "python3 is required for create (markdown->ADF conversion)"
  [[ -f "$descfile" ]] || die "description file not found: $descfile"
  [[ -f "$SCRIPT_DIR/md2adf.py" ]] || die "md2adf.py missing next to this script: $SCRIPT_DIR/md2adf.py"
  local adf payload resp key
  adf=$(python3 "$SCRIPT_DIR/md2adf.py" < "$descfile") || die "markdown->ADF conversion failed"
  payload=$(jq -nc \
    --arg p "$project" --arg t "$itype" --arg s "$summary" --argjson d "$adf" \
    '{fields:{project:{key:$p}, issuetype:{name:$t}, summary:$s, description:$d}}')
  resp=$(api POST /issue --data "$payload")
  if [[ $(echo "$resp" | jq -r '.errorMessages // empty | type') == "array" ]]; then
    die "$(echo "$resp" | jq -r '.errorMessages[]')"
  fi
  key=$(echo "$resp" | jq -r '.key // empty')
  [[ -n "$key" ]] || die "create failed: $resp"
  echo "Created $key"
  echo "URL: ${ATLASSIAN_URL%/}/browse/$key"
}

main() {
  local cmd=${1:-}
  case "$cmd" in
    get)         [[ $# -eq 2 ]] || { usage; exit 2; }; cmd_get        "$2" ;;
    search)      [[ $# -eq 2 ]] || { usage; exit 2; }; cmd_search     "$2" ;;
    transitions) [[ $# -eq 2 ]] || { usage; exit 2; }; cmd_transitions "$2" ;;
    transition)  [[ $# -eq 3 ]] || { usage; exit 2; }; cmd_transition  "$2" "$3" ;;
    comment)     [[ $# -eq 3 ]] || { usage; exit 2; }; cmd_comment     "$2" "$3" ;;
    create)      [[ $# -eq 5 ]] || { usage; exit 2; }; cmd_create     "$2" "$3" "$4" "$5" ;;
    -h|--help|help|"") usage ;;
    *)           usage; exit 2 ;;
  esac
}

main "$@"
