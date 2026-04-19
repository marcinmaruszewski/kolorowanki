#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "=== verify 007: Google OAuth env setup ==="

# Check docs file exists
if [ ! -f "$ROOT/docs/GOOGLE_OAUTH_SETUP.md" ]; then
  echo "FAIL: docs/GOOGLE_OAUTH_SETUP.md nie istnieje"
  exit 1
fi
echo "OK: docs/GOOGLE_OAUTH_SETUP.md istnieje"

# Check env vars in .env.example
for var in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI; do
  if ! grep -q "^${var}=" "$ROOT/.env.example"; then
    echo "FAIL: ${var} nie ma w .env.example"
    exit 1
  fi
  echo "OK: ${var} w .env.example"
done

# Check redirect URI value
if ! grep -q "GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback" "$ROOT/.env.example"; then
  echo "FAIL: GOOGLE_REDIRECT_URI ma zly default (powinno byc http://localhost:3000/api/auth/google/callback)"
  exit 1
fi
echo "OK: GOOGLE_REDIRECT_URI ma poprawny default"

# Check docs mentions both redirect URIs
if ! grep -q "localhost:3000/api/auth/google/callback" "$ROOT/docs/GOOGLE_OAUTH_SETUP.md"; then
  echo "FAIL: docs/GOOGLE_OAUTH_SETUP.md nie zawiera localhost redirect URI"
  exit 1
fi
if ! grep -q "kolorowanki.marcinmaruszewski.me/api/auth/google/callback" "$ROOT/docs/GOOGLE_OAUTH_SETUP.md"; then
  echo "FAIL: docs/GOOGLE_OAUTH_SETUP.md nie zawiera produkcyjnego redirect URI"
  exit 1
fi
echo "OK: oba redirect URI sa opisane w dokumentacji"

echo "=== verify 007: OK ==="
