#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 007: Google OAuth env setup ==="

# Check docs file exists
require_files "$ROOT/docs/GOOGLE_OAUTH_SETUP.md"
echo "OK: docs/GOOGLE_OAUTH_SETUP.md istnieje"

# Check env vars in .env.example
for var in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI; do
  if ! grep -q "^${var}=" "$ROOT/.env.example"; then
    fail "${var} nie ma w .env.example"
  fi
  echo "OK: ${var} w .env.example"
done

# Check redirect URI value
if ! grep -q "GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback" "$ROOT/.env.example"; then
  fail "GOOGLE_REDIRECT_URI ma zly default (powinno byc http://localhost:3000/api/auth/google/callback)"
fi
echo "OK: GOOGLE_REDIRECT_URI ma poprawny default"

# Check docs mentions both redirect URIs
if ! grep -q "localhost:3000/api/auth/google/callback" "$ROOT/docs/GOOGLE_OAUTH_SETUP.md"; then
  fail "docs/GOOGLE_OAUTH_SETUP.md nie zawiera localhost redirect URI"
fi
if ! grep -q "kolorowanki.marcinmaruszewski.me/api/auth/google/callback" "$ROOT/docs/GOOGLE_OAUTH_SETUP.md"; then
  fail "docs/GOOGLE_OAUTH_SETUP.md nie zawiera produkcyjnego redirect URI"
fi
echo "OK: oba redirect URI sa opisane w dokumentacji"

echo "=== verify 007: OK ==="
