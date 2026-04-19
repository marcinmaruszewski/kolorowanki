#!/usr/bin/env bash
set -euo pipefail

echo "=== 015: openai SDK + client singleton ==="

# openai w package.json
grep -q '"openai"' package.json || { echo "FAIL: brak openai w package.json"; exit 1; }

# client.ts istnieje i eksportuje wymagane nazwy
CLIENT=src/lib/openai/client.ts
[ -f "$CLIENT" ] || { echo "FAIL: brak $CLIENT"; exit 1; }
grep -q 'export const openai' "$CLIENT"    || { echo "FAIL: brak export openai"; exit 1; }
grep -q 'export const TEXT_MODEL' "$CLIENT"  || { echo "FAIL: brak export TEXT_MODEL"; exit 1; }
grep -q 'export const IMAGE_MODEL' "$CLIENT" || { echo "FAIL: brak export IMAGE_MODEL"; exit 1; }

# .env.example zawiera wymagane klucze
grep -q 'OPENAI_API_KEY' .env.example        || { echo "FAIL: brak OPENAI_API_KEY w .env.example"; exit 1; }
grep -q 'OPENAI_TEXT_MODEL' .env.example     || { echo "FAIL: brak OPENAI_TEXT_MODEL w .env.example"; exit 1; }
grep -q 'OPENAI_IMAGE_MODEL' .env.example    || { echo "FAIL: brak OPENAI_IMAGE_MODEL w .env.example"; exit 1; }

# OPENAI_API_KEY nie ma wartości (pusty klucz)
grep 'OPENAI_API_KEY' .env.example | grep -vq 'OPENAI_API_KEY=' && { echo "FAIL: OPENAI_API_KEY ma wartość"; exit 1; } || true

# tsc
docker compose run --rm app pnpm exec tsc --noEmit

echo "OK"
