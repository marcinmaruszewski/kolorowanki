#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
source "$ROOT/tasks/verify/_helpers.sh"

echo "=== task-014: media collection ==="

# tsc
echo ">> tsc --noEmit"
run_tsc

# plik kolekcji — wymagane pola konfiguracji
echo ">> grep konfiguracji upload w media.ts"
grep -q "slug: 'media'" src/payload/collections/media.ts
grep -q "staticDir" src/payload/collections/media.ts
grep -q "mimeTypes" src/payload/collections/media.ts
grep -q "image/png" src/payload/collections/media.ts
grep -q "application/pdf" src/payload/collections/media.ts

# access: read public
echo ">> read: () => true w media.ts"
grep -q "read: () => true" src/payload/collections/media.ts

# pola alt i calendar
echo ">> pola alt i calendar w media.ts"
grep -q "'alt'" src/payload/collections/media.ts
grep -q "'calendar'" src/payload/collections/media.ts
grep -q "relationTo: 'calendars'" src/payload/collections/media.ts

# kolekcja zarejestrowana w konfigu
echo ">> Media zarejestrowane w payload.config.ts"
grep -q "Media" src/payload.config.ts

# docker-compose: bind mount dla media
echo ">> bind mount media w docker-compose.yml"
grep -q "./media:/app/media" docker-compose.yml

# .gitignore: media/ wykluczone
echo ">> media/ w .gitignore"
grep -q "^media/" .gitignore

echo "=== OK ==="
