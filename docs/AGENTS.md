# AGENTS.md — instrukcja pracy dla agenta

Ten plik opisuje, jak agent (np. Claude Code, Cursor, Codex) ma pracować z tym repo. Przeczytaj to **przed** tknięciem kodu.

## Zasada zerowa: wszystko w Dockerze

Runtime aplikacji, migracje, testy, `pnpm install`, `pnpm exec`, `pnpm dev`, Vitest, Playwright, generowanie typów Payload — **wszystko uruchamia się w kontenerze** `app`, przez:

```bash
docker compose run --rm app <komenda>
# lub, gdy kontener już działa:
docker compose exec app <komenda>
```

**Wyjątki uruchamiane na hoście**:
- `./scripts/task …` (bash helper, zero zależności Node)
- `git` (agent commituje przez skrypt, nie ręcznie — patrz sekcja „Commity")
- `docker compose …` i `docker …`
- Edytory tekstowe, IDE

Host może mieć Node/pnpm zainstalowane na potrzeby IDE (TypeScript language server), ale **agent nigdy nie woła ich bezpośrednio** — zawsze przez `docker compose`.

Konsekwencja: `pnpm-lock.yaml` powstaje w kontenerze przy pierwszym `pnpm install` (task 005), nie na hoście. Bind mount całego repo do `/app` zapewnia, że zmiany w `node_modules` są widoczne po stronie hosta dla IDE (działa bo i host, i kontener to Linux x64).

## Flow pracy nad pojedynczym taskiem

1. **Zdobądź kontekst**:
   ```bash
   ./scripts/task context <id>
   ```
   Dostaniesz: `OVERVIEW.md` + `PRD.md` + `ADR.md` + `AGENTS.md` + zadeklarowany task + wszystkie jego `depends_on` (transitywnie). To jest Twój cały briefing.

2. **Zaimplementuj** — dokładnie to, co mówi sekcja `## Zakres (DO)`. Nie dorzucaj rzeczy z `## Poza zakresem`. Nie refaktoruj poza taskiem. Edytuj **tylko** pliki z frontmatter `touches`; jeśli potrzebujesz dodać plik poza listą, dopisz go do `touches` w tym samym commicie i uzasadnij w commit message (linia `Extra touches: <plik> — <powód>`).

3. **Zweryfikuj lokalnie**:
   ```bash
   ./scripts/task verify <id>
   ```
   Skrypt:
   - uruchomi `tasks/verify/<id>.sh` (jeśli istnieje)
   - uruchomi wszystkie poprzednie `tasks/verify/NNN.sh` dla tasków `001..id-1` ze statusem `done` (regresja)
   - wypisze checklistę manualną z `## Weryfikacja manualna`
   
   Automatyczne skrypty weryfikacyjne typowo wywołują `docker compose run --rm app pnpm vitest run tests/task-<id>` itp. — weryfikacja też siedzi w Dockerze.

4. **Oznacz jako done i zacommituj**:
   ```bash
   ./scripts/task done <id>
   ```
   Ta jedna komenda:
   - przełącza `status: pending` → `status: done` w frontmatter taska
   - regeneruje `tasks/STATUS.md`
   - stage'uje **tylko** pliki z listy `touches` + zmodyfikowany plik taska + `STATUS.md` + ewentualnie `pnpm-lock.yaml` jeśli się zmienił
   - sprawdza, czy w working tree nie zostały zmiany poza powyższymi — jeśli tak, **przerywa** i prosi o ogarnięcie
   - tworzy commit w formacie Conventional Commits:
     ```
     <type>(task-XXX): <title z frontmatter>

     Closes task XXX.

     Verify: ./scripts/task verify XXX
     ```
   - `<type>` bierze z pola `type:` frontmatter taska (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`)

## Zasady twarde

- **NIE** modyfikuj `docs/OVERVIEW.md`, `docs/PRD.md`, `docs/ADR.md` w ramach taska implementacyjnego. Niespójność → zgłoś userowi i zatrzymaj się.
- **NIE** modyfikuj tasków innych niż ten, nad którym pracujesz. `tasks/STATUS.md` jest zmieniane tylko przez `scripts/task done`.
- **NIE** oznaczaj taska jako `done`, jeśli `verify` ma czerwone testy — nawet gdy user prosi. Zgłoś problem.
- **NIE** zmieniaj wersji zależności w `package.json` poza zakresem taska.
- **NIE** commituj ręcznie, nie używaj `git amend`, nie łącz dwóch tasków w jeden commit. Commitami zajmuje się tylko `scripts/task done`.
- **NIE** dodawaj plików do `git add -A`. Jeśli skrypt pokazuje niezaplanowane zmiany — najpierw je zrozum, potem albo cofnij, albo dopisz do `touches` świadomie.

## Konwencje kodu

- TypeScript strict mode, ESM.
- Komentarze tylko gdy kod sam się nie tłumaczy.
- Nazwy plików `kebab-case`, komponenty React w `PascalCase.tsx`.
- UI texts: polski. Komentarze w kodzie: angielski. Nazwy identyfikatorów: angielski.
- Konfiguracja przez env (`.env.example` jest źródłem prawdy dla listy zmiennych).
- Błędy OpenAI/Batch: zawsze logowane do `generationJobs.errorLog`, nigdy do stdout w prod.

## Konwencje tasków

- ID taska to trzycyfrowa liczba (`001`, `042`, `137`). Nie zmieniaj, nie renumeruj.
- `depends_on` zawiera **wszystkie** taski, które muszą być `done` zanim zaczniesz.
- `type:` w frontmatter wyznacza typ Conventional Commit — nie zmieniaj go bez zgody usera.
- `touches` to hard-lista plików, których task dotyka. Traktuj ją jak kontrakt: skrypt `done` odmówi commita, jeśli są zmiany poza nią.
- Każdy task ma ≤~2h roboty. Jeśli się rozlewa — zgłoś userowi, on ewentualnie rozbije na podtaski.

## Testy

- **Vitest** — unit + integration (szybkie, uruchamiane w verify).
- **Playwright** — e2e (wolniejsze, osobna komenda).
- Testy per task żyją w `tests/task-<id>/` (np. `tests/task-006/google-oauth.test.ts`).
- Wszystko odpalane w kontenerze `app`.
- Verify `<id>` puszcza testy **wszystkich** tasków `001..id` ze statusem `done` + bieżący — to jest regresja. Zielony wcześniejszy task po Twoich zmianach nie może się zepsuć.

## Auth w testach (dev-login backdoor)

Logowanie Google w testach jest niemożliwe (wymaga interakcji użytkownika + hasła). Mamy dedykowany **dev-login endpoint** `POST /api/auth/dev-login`, dostępny tylko gdy `ENABLE_DEV_LOGIN=true` w env (domyślnie tak w `.env.example` dla dev, nieustawione w prod Dokploy). Pozwala on zalogować się jako dowolny istniejący user bez Google OAuth.

Playwright i integration testy używają tego endpointu. Real Google flow testujesz **tylko ręcznie** w checkliście odpowiedniego taska — user klika sam.

## Jeśli utkniesz

- Niejasny wymóg — **przerwij i zapytaj usera**. Nie zgaduj.
- Sprzeczność `PRD.md` vs `ADR.md` albo task vs docs — **przerwij**, nie rozstrzygaj samodzielnie.
- Brakująca zależność (task 005 zależy od 003, ale 003 nie `done`) — **przerwij**, powiedz userowi.
- Test z wcześniejszego taska jest czerwony po Twoich zmianach — regresja, **napraw zanim oznaczysz jako done**.
- `docker compose run --rm app …` nie działa → najpierw sprawdź `docker compose ps` i logi. Nie skacz do alternatywnych ścieżek (`npm` na hoście itp.).
