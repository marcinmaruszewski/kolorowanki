#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== verify 017: image-prompt builder ==="

# Sprawdź pliki
test -f src/lib/openai/image-prompt.ts || { echo "FAIL: brak image-prompt.ts"; exit 1; }
test -f src/lib/openai/templates/image-prompt-template.txt || { echo "FAIL: brak image-prompt-template.txt"; exit 1; }
test -f src/lib/openai/__tests__/image-prompt.test.ts || { echo "FAIL: brak image-prompt.test.ts"; exit 1; }

# Sprawdź placeholdery w szablonie
grep -q '<motyw dnia>' src/lib/openai/templates/image-prompt-template.txt || { echo "FAIL: brak <motyw dnia> w szablonie"; exit 1; }
grep -q '<glowny symbol albo mala scenka>' src/lib/openai/templates/image-prompt-template.txt || { echo "FAIL: brak <glowny symbol albo mala scenka> w szablonie"; exit 1; }
grep -q 'DD\.MM' src/lib/openai/templates/image-prompt-template.txt || { echo "FAIL: brak DD.MM w szablonie"; exit 1; }

# TypeScript
run_tsc

# Testy vitest
run_vitest src/lib/openai/__tests__/image-prompt.test.ts

echo "=== verify 017: OK ==="
