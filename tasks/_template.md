---
id: XXX
title: Krótki tytuł taska w trybie rozkazującym
type: chore
status: pending
depends_on: []
touches:
  - path/to/file.ts
---

## Cel

Jedno-dwa zdania — co task osiąga biznesowo, dlaczego w ogóle istnieje.

## Kontekst

Jeśli task wymaga decyzji niewynikającej z ADR/PRD, opisz ją tutaj. W przeciwnym razie pomiń tę sekcję.

## Zakres (DO)

- [ ] konkretna, mała rzecz 1
- [ ] konkretna, mała rzecz 2
- [ ] …

## Poza zakresem (DON'T)

- rzeczy, których nie robimy w tym tasku mimo że mogą się prosić
- delegacja do taska XXX+N

## Kryteria akceptacji

Warunki, które **muszą** być spełnione, żeby task był `done`. Konkretne i sprawdzalne.

- Plik `X` istnieje i zawiera `Y`
- Komenda `docker compose run --rm app Z` zwraca exit 0
- Endpoint `/api/foo` zwraca 200 na zalogowanym userze

## Weryfikacja automatyczna

Skrypt `tasks/verify/XXX.sh` (tworzysz razem z taskiem):

```bash
# Szkic logiki — faktyczny kod w tasks/verify/XXX.sh
test -f path/to/file.ts
docker compose run --rm app pnpm vitest run tests/task-XXX
```

## Weryfikacja manualna

- [ ] Otwórz http://localhost:3000/coś i kliknij przycisk
- [ ] Sprawdź w Payload Admin UI, że rekord pojawił się w kolekcji
- [ ] (inne kroki, które trudno zautomatyzować)

## Notatki dla agenta

- Czego NIE dotykać (np. „nie rusz `src/lib/openai/` w tym tasku").
- Znane pułapki (np. „Payload v3 nie wspiera X w konfigu, użyj Y").
- Preferencje usera specyficzne dla tego obszaru.

## Możliwe `type:` dla Conventional Commits

- `feat` — nowa funkcjonalność widoczna dla usera
- `fix` — naprawa buga
- `chore` — infrastruktura, konfiguracja, bootstrap (bez zmiany feature'ów)
- `docs` — tylko dokumentacja
- `refactor` — restrukturyzacja kodu bez zmiany zachowania
- `test` — dodawanie/poprawianie testów
- `ci` — zmiany w CI/CD
