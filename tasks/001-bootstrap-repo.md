---
id: 001
title: Zainicjalizuj repozytorium i pliki bazowe
type: chore
status: pending
depends_on: []
touches:
  - .gitignore
  - .editorconfig
  - .nvmrc
  - README.md
  - LICENSE
---

## Cel

Utworzyć pusty, dobrze skonfigurowany skorupiak repo przed instalacją jakichkolwiek zależności. Chcemy stabilnej bazy, którą reszta tasków wypełnia.

## Kontekst

Repo żyje w `/home/mmarus03/dump/kolorowanki/kolorowanki-dokploy`. Nie jest jeszcze git-repo, docs/ są już na miejscu (`OVERVIEW.md`, `PRD.md`, `ADR.md`, `AGENTS.md`). Ten task dokłada resztę infrastrukturalnych plików bazowych.

## Zakres (DO)

- [ ] `git init` w katalogu repo (jeśli jeszcze nie jest repo).
- [ ] Utwórz `.gitignore` obejmujący: `node_modules/`, `.next/`, `dist/`, `build/`, `*.log`, `.env`, `.env.local`, `media/`, `.DS_Store`, `coverage/`, `playwright-report/`, `test-results/`.
- [ ] Utwórz `.editorconfig` (UTF-8, LF, indent 2 spacje dla TS/JS/JSON, indent 4 spacje dla Pythona, trim trailing whitespace).
- [ ] Utwórz `.nvmrc` z `22` (Node 22 LTS).
- [ ] Utwórz `README.md` z nagłówkiem „Kalendarz" i linkami do `docs/OVERVIEW.md`, `docs/PRD.md`, `docs/ADR.md`, `docs/AGENTS.md`, `tasks/`. Krótka instrukcja „jak zacząć": `./scripts/task list` i `./scripts/task context <id>`.
- [ ] Utwórz `LICENSE` typu MIT z nazwiskiem „Marcin Maruszewski" i rokiem 2026.

## Poza zakresem (DON'T)

- Nie instaluj `pnpm` ani pakietów (to task 002).
- Nie twórz `package.json` (to task 002).
- Nie modyfikuj plików w `docs/` ani `tasks/`.
- Nie commituj — user commituje ręcznie.

## Kryteria akceptacji

- Katalog jest git-repo (`git rev-parse --is-inside-work-tree` zwraca `true`).
- Wszystkie pliki z listy `touches` istnieją.
- `.gitignore` zawiera wszystkie wymienione wzorce.
- `README.md` zawiera linki (markdown `[...](...)`) do 4 dokumentów w `docs/`.

## Weryfikacja automatyczna

`tasks/verify/001.sh` sprawdza obecność plików i zawartość kluczowych wzorców w `.gitignore`.

## Weryfikacja manualna

- [ ] Przeczytaj `README.md` i upewnij się, że linki działają w podglądzie markdown.
- [ ] Otwórz `.editorconfig` w swoim edytorze — sprawdź, czy IDE go respektuje.

## Notatki dla agenta

- Treść `README.md` ma być krótka (do 30 linii). Nie wklejaj treści `OVERVIEW.md` — tylko link.
- Nie dodawaj `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, badge'y CI itp. — poza scope'em.
