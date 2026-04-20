# TESTING.md — polityka testów

To jest źródło prawdy dla nowych tasków, `tasks/verify/*.sh`, `JOB.md`, `AGENTS.md`, `CLAUDE.md` i ustawień Claude Code.

## Zasady bazowe

- Domyślny automat to **Vitest** uruchamiany w kontenerze Node, czyli serwisie `app`.
- Dla pure unit i mockowanych integration używaj `docker compose run --rm app pnpm vitest run …`.
- Dla testów, które wymagają działającej aplikacji HTTP, po podniesieniu stacka używaj `docker compose exec -T app pnpm vitest run …`.
- Dla lokalnych testów UI/e2e/smoke domyślnym narzędziem jest **`agent-browser`**.
- Nie buduj nowych verify-skryptów na `curl`, ręcznych cookie-jarach, `wait`, PID-ach, backgroundowaniu procesów ani pollingu HTTP po localhost, jeśli ten sam dowód da się uzyskać przez `vitest` lub `agent-browser`.
- `Playwright` traktuj jako wyjątek historyczny. W nowych taskach preferuj `agent-browser`, chyba że task wyraźnie wymaga Playwright albo repo ma już gotowy harness, którego rozszerzenie jest tańsze niż nowy flow.
- Jeśli verify-script pasuje do istniejącego wzorca, preferuj helpery z `tasks/verify/_helpers.sh` zamiast kopiowania sekwencji `docker compose`.

## Macierz decyzji

- **Pure unit / parser / mapper / prompt builder / worker orchestration z mockami**: tylko `vitest`.
- **Hooki Payload, route handlery, Server Actions, integracja z repo**: `vitest` w `app`, z mockami albo z lokalnym stackiem zależnie od potrzeby. Gdy test odpytuje HTTP aplikacji, uruchom go przez `docker compose exec -T app …` na już działającym kontenerze.
- **UI pages, guardy auth, formularze, klikalne flow, downloady, smoke lokalny**: `agent-browser`.
- **Zewnętrzny smoke po deployu albo task stricte o API contract**: shell + `curl` są dozwolone, ale tylko jako wyjątek opisany w tasku.

## Czysta baza i wolumeny

- Jeśli test dotyka Postgresa, Redisa, sesji, kolejek, auth albo trwałego stanu Payload, verify-script ma startować z czystych wolumenów projektu:

```bash
docker compose down -v --remove-orphans
docker compose up -d postgres redis
```

- Jeśli dany verify potrzebuje też działającej aplikacji WWW, po resecie podnieś `app`:

```bash
docker compose up -d app
```

- **Nie używaj globalnego `docker volume prune`**. To jest zbyt szerokie i może skasować wolumeny niezwiązane z repo. Projektowym odpowiednikiem "czystej bazy" jest `docker compose down -v --remove-orphans`.
- Pure unit testy na pełnych mockach nie wymagają resetu bazy. Nie rób ciężkiego resetu bez potrzeby.
- Seed danych rób przez kod uruchamiany w `docker compose run --rm app …`, a nie przez ręczne klikanie albo `curl` po endpointach aplikacji.

## Wzorzec nowego `tasks/verify/XXX.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Pure unit / mockowane integration:
docker compose run --rm app pnpm exec tsc --noEmit
docker compose run --rm app pnpm vitest run tests/task-XXX

# Jeśli task dotyka trwałego stanu albo UI:
docker compose down -v --remove-orphans
docker compose up -d postgres redis app
docker compose exec -T app pnpm vitest run tests/task-XXX

agent-browser --session task-XXX open http://127.0.0.1:3000/login
agent-browser --session task-XXX wait --load networkidle
docker compose down -v --remove-orphans
```

Nie każdy verify potrzebuje wszystkich kroków. Zasada jest prosta:

- logika i integracja kodowa bez żyjącego HTTP: `docker compose run --rm app pnpm vitest run …`
- testy wymagające działającej aplikacji: po `docker compose up -d …` użyj `docker compose exec -T app pnpm vitest run …`
- zachowanie w przeglądarce: potem `agent-browser`
- czysta baza: tylko gdy test realnie dotyka stanu

## Login i seed w testach

- Jeśli browser test wymaga zalogowanego usera, korzystaj z dev-login backdoora opisanego w `docs/AGENTS.md`.
- Sesję zakładaj przez flow kontrolowany przez test, nie przez ręczne operacje na cookie-jarach w shellu, chyba że task dotyczy wyłącznie API.
- Dane testowe seeduj wprost przez Payload lub dedykowany skrypt uruchamiany w kontenerze `app`.

## Dla autorów tasków

- W `## Weryfikacja automatyczna` opisuj przede wszystkim `vitest` i ewentualnie `agent-browser`.
- Nie wpisuj do nowych tasków wymagań typu "odpal `curl`, czekaj na PID, sprawdź ręcznie status po localhost", jeśli nie testujesz dokładnie tego zachowania.
- Jeśli task wymaga czystej bazy, napisz to wprost w tasku zamiast zostawiać agentowi pole do interpretacji.
