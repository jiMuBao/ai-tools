#!/usr/bin/env bash
#
# cb-pr — list and inspect Bitbucket Cloud pull requests for the current repo.
# Workspace/slug is auto-detected from `git remote get-url origin`.
# Auths with $BITBUCKET_USERNAME / $BITBUCKET_TOKEN.

set -euo pipefail

die() { echo "cb-pr: $*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: cb-pr [open|merged|mine|<number>]

  (none) | open   List open PRs (default)
  merged          List up to 50 most-recently-merged PRs
  mine            Open PRs authored by $BITBUCKET_USERNAME
  <number>        Show details for one PR (reviewers, CI status, description)
EOF
}

# --- env + tools ---
: "${BITBUCKET_USERNAME:?cb-pr: BITBUCKET_USERNAME is not set}"
: "${BITBUCKET_TOKEN:?cb-pr: BITBUCKET_TOKEN is not set}"
command -v jq >/dev/null 2>&1 || die "jq not found in PATH"
command -v curl >/dev/null 2>&1 || die "curl not found in PATH"

# --- detect workspace/slug from origin remote ---
remote_url=$(git remote get-url origin 2>/dev/null) \
  || die "no 'origin' remote (run from inside a Bitbucket clone)"

clean="${remote_url%.git}"
clean="${clean%/}"
if [[ "$clean" =~ bitbucket\.org[:/]+([^/]+)/([^/]+)$ ]]; then
  WS="${BASH_REMATCH[1]}"
  SLUG="${BASH_REMATCH[2]}"
else
  die "origin '$remote_url' is not a bitbucket.org URL"
fi

API="https://api.bitbucket.org/2.0/repositories/$WS/$SLUG"
AUTH=(-u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN")

# --- API helper: curl + surface Bitbucket error envelopes ---
api() {
  local resp http
  resp=$(curl -sS -w '\n%{http_code}' "${AUTH[@]}" "$@") \
    || die "curl failed: $resp"
  http="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  if [[ "$http" -ge 400 ]]; then
    local msg
    msg=$(printf '%s' "$resp" | jq -r '.error.message // empty' 2>/dev/null || true)
    if [[ "$http" == 401 ]]; then
      die "401 Unauthorized — refresh BITBUCKET_TOKEN"
    elif [[ "$http" == 404 ]]; then
      die "404 Not Found — check repo ($WS/$SLUG) and PR number"
    fi
    die "HTTP $http: ${msg:-$resp}"
  fi
  printf '%s' "$resp"
}

LIST_FIELDS="size,values.id,values.title,values.author.display_name,values.author.nickname,values.source.branch.name,values.destination.branch.name,values.updated_on,values.links.html.href"

list_prs() {
  local state="$1" filter="${2:-.}"
  # Single-quote the jq program so bash doesn't try to expand $ws/$slug/$state.
  # The user-supplied filter is the only piece interpolated from bash.
  local prog
  prog='"Repo: \($ws)/\($slug)  |  state=\($state)  |  total=\(.size)",
"",
(.values | '"$filter"' | sort_by(.updated_on) | reverse |
  if length == 0 then "  (no PRs)" else
    (.[] |
      "#\(.id)  \(.title)\n    by \(.author.display_name)  |  \(.source.branch.name) → \(.destination.branch.name)\n    updated \(.updated_on)\n    \(.links.html.href)\n")
  end)'
  api "$API/pullrequests?state=$state&pagelen=50&fields=$LIST_FIELDS" \
    | jq -r --arg ws "$WS" --arg slug "$SLUG" --arg state "$state" "$prog"
}

mine_filter() {
  # Match against nickname, display_name, and dot-to-space variant of display_name
  # so usernames like 'jim.yang' match authors like 'Jim Yang'.
  local me_short="${BITBUCKET_USERNAME%@*}"
  jq --arg me "$me_short" -c '
    [.[] | select(
      ((.author.nickname // "") | ascii_downcase | contains($me | ascii_downcase)) or
      ((.author.display_name // "") | ascii_downcase | contains($me | ascii_downcase)) or
      ((.author.display_name // "") | ascii_downcase | contains($me | ascii_downcase | gsub("\\."; " ")))
    )]
  '
}

list_mine() {
  local raw filtered
  raw=$(api "$API/pullrequests?state=OPEN&pagelen=50&fields=$LIST_FIELDS")
  filtered=$(printf '%s' "$raw" | jq '.values' | mine_filter)
  printf '%s' "$raw" \
    | jq -r --arg ws "$WS" --arg slug "$SLUG" --argjson values "$filtered" '
        "Repo: \($ws)/\($slug)  |  state=OPEN  |  mine=\($values | length)",
        "",
        ($values | sort_by(.updated_on) | reverse |
          if length == 0 then "  (no PRs match $BITBUCKET_USERNAME)" else
            (.[] |
              "#\(.id)  \(.title)\n    by \(.author.display_name)  |  \(.source.branch.name) → \(.destination.branch.name)\n    updated \(.updated_on)\n    \(.links.html.href)\n")
          end)
      '
}

show_pr() {
  local id="$1" pr statuses
  pr=$(api "$API/pullrequests/$id")
  statuses=$(api "$API/pullrequests/$id/statuses?pagelen=20" 2>/dev/null || echo '{"values":[]}')

  printf '%s' "$pr" | jq -r '
    "#\(.id)  \(.title)",
    "State:    \(.state)",
    "Author:   \(.author.display_name) (\(.author.nickname // "?"))",
    "Branch:   \(.source.branch.name) → \(.destination.branch.name)",
    "Created:  \(.created_on)",
    "Updated:  \(.updated_on)",
    "URL:      \(.links.html.href)",
    "",
    "Reviewers:",
    (
      [.participants[]? | select(.role == "REVIEWER")] as $rs
      | if ($rs | length) == 0 then "  (none)"
        else ($rs[] |
          "  - \(.user.display_name)  state=\(.state // "PENDING")\(if .approved then "  ✓" else "" end)")
        end
    ),
    "",
    "Description:",
    (
      (.description // "") as $d
      | if ($d | length) == 0 then "  (empty)"
        else ($d | split("\n") | .[] | "  " + .)
        end
    )
  '
  echo
  echo "CI status:"
  printf '%s' "$statuses" | jq -r '
    .values // [] |
    if length == 0 then "  (none)"
    else (.[] | "  - \(.state)  \(.name) — \(.url // "")")
    end
  '
}

# --- dispatch ---
cmd="${1:-}"
case "$cmd" in
  ""|open)  list_prs OPEN ;;
  merged)   list_prs MERGED ;;
  mine)     list_mine ;;
  -h|--help|help) usage ;;
  *)
    if [[ "$cmd" =~ ^[0-9]+$ ]]; then
      show_pr "$cmd"
    else
      usage
      exit 2
    fi
    ;;
esac
