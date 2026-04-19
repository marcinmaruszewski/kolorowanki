#!/usr/bin/env bash
# Verify task 001: bootstrap repo + base files.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "  ✘ $*" >&2; exit 1; }
ok()   { echo "  ✓ $*"; }

# 1. git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "repo is not a git working tree"
ok "git repo initialized"

# 2. required files exist
for f in .gitignore .editorconfig .nvmrc README.md LICENSE; do
  [[ -f "$f" ]] || fail "missing file: $f"
  ok "exists: $f"
done

# 3. .gitignore patterns
required_ignores=(
  "node_modules/"
  ".next/"
  "dist/"
  "build/"
  "*.log"
  ".env"
  ".env.local"
  "media/"
  ".DS_Store"
  "coverage/"
  "playwright-report/"
  "test-results/"
)
for pattern in "${required_ignores[@]}"; do
  grep -Fxq "$pattern" .gitignore || fail ".gitignore missing pattern: $pattern"
done
ok ".gitignore contains all required patterns"

# 4. .nvmrc node 22
grep -qx "22" .nvmrc || fail ".nvmrc must contain exactly '22'"
ok ".nvmrc pins Node 22"

# 5. .editorconfig sanity
grep -q "^root = true" .editorconfig || fail ".editorconfig missing 'root = true'"
grep -q "end_of_line = lf" .editorconfig || fail ".editorconfig missing 'end_of_line = lf'"
grep -q "charset = utf-8" .editorconfig || fail ".editorconfig missing 'charset = utf-8'"
grep -Eq "^\[\*\.py\]" .editorconfig || fail ".editorconfig missing [*.py] section"
ok ".editorconfig has required settings"

# 6. README links to all 4 docs
for doc in docs/OVERVIEW.md docs/PRD.md docs/ADR.md docs/AGENTS.md; do
  grep -Fq "($doc)" README.md || fail "README.md missing markdown link to $doc"
done
ok "README.md links to all 4 docs"

# 7. LICENSE mentions MIT + author + year
grep -q "MIT License" LICENSE || fail "LICENSE missing 'MIT License'"
grep -q "2026" LICENSE || fail "LICENSE missing year 2026"
grep -q "Marcin Maruszewski" LICENSE || fail "LICENSE missing author name"
ok "LICENSE is MIT 2026 Marcin Maruszewski"

echo "  → task 001 verify OK"
