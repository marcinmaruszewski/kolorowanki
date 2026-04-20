#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
source "$REPO_ROOT/tasks/verify/_helpers.sh"

ok()   { echo "OK:   $1"; }

# File existence
[ -f package.json ]  || fail "package.json not found"
ok "package.json exists"

[ -f .npmrc ] || fail ".npmrc not found"
ok ".npmrc exists"

[ -f tsconfig.json ] || fail "tsconfig.json not found"
ok "tsconfig.json exists"

# Valid JSON
jq empty package.json  || fail "package.json invalid JSON"
ok "package.json valid JSON"

jq empty tsconfig.json || fail "tsconfig.json invalid JSON"
ok "tsconfig.json valid JSON"

# packageManager field present and correct format
PKG_MANAGER=$(jq -r '.packageManager // ""' package.json)
echo "$PKG_MANAGER" | grep -qE '^pnpm@[0-9]+\.[0-9]+\.[0-9]+$' \
  || fail "packageManager missing or wrong format (got: $PKG_MANAGER)"
ok "packageManager = $PKG_MANAGER"

# type: module
PKG_TYPE=$(jq -r '.type // ""' package.json)
[ "$PKG_TYPE" = "module" ] || fail "package.json type != module (got: $PKG_TYPE)"
ok "type = module"

echo ""
echo "002 verify PASSED"
