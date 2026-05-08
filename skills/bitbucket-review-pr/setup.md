# Bitbucket Token Setup

## Steps

1. Go to **https://id.atlassian.com/manage-profile/security/api-tokens**
2. Click **Create API token**
3. Give it a label (e.g. "Megatron Code Review")
4. Select these scopes:
   - `read:pullrequest:bitbucket` — read PR details, diffs, comments
   - `write:pullrequest:bitbucket` — post comments on PRs
   - `read:repository:bitbucket` — read file contents and diffs
5. Click **Create** — copy the token immediately (shown only once, starts with `ATATT3x...`)

## Set Environment Variables

```bash
export BITBUCKET_TOKEN="ATATT3x..."
export BITBUCKET_USERNAME="your.email@company.com"   # your Atlassian login email
```

Add to `~/.bashrc` or `~/.zshrc` to persist across sessions:

```bash
echo 'export BITBUCKET_TOKEN="ATATT3x..."' >> ~/.bashrc
echo 'export BITBUCKET_USERNAME="your.email@company.com"' >> ~/.bashrc
source ~/.bashrc
```

## Verify Auth

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -u "$BITBUCKET_USERNAME:$BITBUCKET_TOKEN" \
  "https://api.bitbucket.org/2.0/user"
```

- **200** = working perfectly
- **403** = auth works but scope issue (still OK — re-check scopes above)
- **401** = bad token or wrong username — regenerate token
