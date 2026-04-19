#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

fail() { echo "FAIL: $1" >&2; exit 1; }
ok()   { echo "OK:   $1"; }

# File existence
[ -f "$REPO_ROOT/package.json" ]  || fail "package.json not found"
ok "package.json exists"

[ -f "$REPO_ROOT/.npmrc" ] || fail ".npmrc not found"
ok ".npmrc exists"

[ -f "$REPO_ROOT/tsconfig.json" ] || fail "tsconfig.json not found"
ok "tsconfig.json exists"

# Valid JSON
jq empty "$REPO_ROOT/package.json"  || fail "package.json invalid JSON"
ok "package.json valid JSON"

jq empty "$REPO_ROOT/tsconfig.json" || fail "tsconfig.json invalid JSON"
ok "tsconfig.json valid JSON"

# packageManager field present and correct format
PKG_MANAGER=$(jq -r '.packageManager // ""' "$REPO_ROOT/package.json")
echo "$PKG_MANAGER" | grep -qE '^pnpm@[0-9]+\.[0-9]+\.[0-9]+$' \
  || fail "packageManager missing or wrong format (got: $PKG_MANAGER)"
ok "packageManager = $PKG_MANAGER"

# type: module
PKG_TYPE=$(jq -r '.type // ""' "$REPO_ROOT/package.json")
[ "$PKG_TYPE" = "module" ] || fail "package.json type != module (got: $PKG_TYPE)"
ok "type = module"

# node_modules and pnpm-lock.yaml must NOT exist yet
[ ! -d "$REPO_ROOT/node_modules" ] || fail "node_modules must not exist at this stage"
ok "node_modules absent"

[ ! -f "$REPO_ROOT/pnpm-lock.yaml" ] || fail "pnpm-lock.yaml must not exist at this stage"
ok "pnpm-lock.yaml absent"

echo ""
echo "002 verify PASSED"
