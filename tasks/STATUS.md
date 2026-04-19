# Status tasków

Autogenerowane przez `./scripts/task list` i aktualizowane przez `./scripts/task done <id>`. Nie edytuj ręcznie.

| ID  | Tytuł                                               | Status       | Depends on |
| --- | --------------------------------------------------- | ------------ | ---------- |
| 001 | Zainicjalizuj repozytorium i pliki bazowe           | pending      |            |
| 002 | Utwórz package.json i tsconfig bazowy (bez inst…)   | pending      | 001        |
| 003 | Postaw Postgres i Redis przez docker-compose        | pending      | 001        |
| 004 | Skonteneryzuj aplikację (Dockerfile + usługa app)   | pending      | 002, 003   |
| 005 | Zainstaluj Payload v3 + Next.js w kontenerze        | pending      | 004        |
| 006 | Skonfiguruj kolekcję users z bazowymi polami        | pending      | 005        |
| 007 | Konfiguracja Google OAuth (Cloud Console + env)     | pending      | 006        |
| 008 | Strategia auth Google dla Payload v3                | pending      | 007        |
| 009 | Backdoor dev-login dla testów e2e                   | pending      | 008        |
| 010 | Enforcement limitu 1 kalendarz/miesiąc + cron       | pending      | 006        |
| 011 | Kolekcja calendars                                  | pending      | 006, 010   |
| 012 | Kolekcja days (obrazek per dzień)                   | pending      | 011        |
| 013 | Kolekcja generation-jobs (tracking OpenAI)          | pending      | 011        |
| 014 | Kolekcja media — lokalne pliki                      | pending      | 005        |
| 015 | Klient OpenAI + ENV modeli                          | pending      | 005        |
| 016 | Schema i prompt research (plan miesiąca)            | pending      | 015        |
| 017 | Builder promptu obrazu (na podstawie skill)         | pending      | 015        |
| 018 | Wrapper OpenAI Batch API (submit/status/download)   | pending      | 015        |
| 019 | Setup BullMQ — 4 kolejki + connection               | pending      | 003        |
| 020 | Kontener worker (tsx entrypoint)                    | pending      | 004, 019   |
| 021 | Worker kolejki research (plan miesiąca)             | pending      | 016, 018, 020 |
| 022 | Worker kolejki images (parsowanie batch → media)    | pending      | 017, 018, 020 |
| 023 | Worker regeneracji pojedynczego dnia (realtime)     | pending      | 022        |
| 024 | Strona logowania (PL) z Google                      | pending      | 008        |
| 025 | Layout aplikacyjny + nawigacja auth-aware           | pending      | 024        |
| 026 | Strona listy moich kalendarzy                       | pending      | 011, 025   |
| 027 | Kreator nowego kalendarza (rok + miesiąc)           | pending      | 021, 026   |
| 028 | Strona planu kalendarza (read-only) + polling       | pending      | 021, 027   |
| 029 | Edycja planu (okazja, motyw)                        | pending      | 028        |
| 030 | Akceptacja planu — trigger batch obrazków           | pending      | 022, 029   |
| 031 | Galeria obrazków (grid 7 kolumn)                    | pending      | 022, 030   |
| 032 | Modal regeneracji dnia (prompt override)            | pending      | 023, 031   |
| 033 | Licznik regeneracji + ostrzeżenia                   | pending      | 032        |
| 034 | Port build_slots() Python → TS                      | pending      | 002        |
| 035 | Edytor fabric.js (A4 canvas + obrazki)              | pending      | 031, 034   |
| 036 | Interakcje fabric (drag/rotate/scale/shuffle)       | pending      | 035        |
| 037 | Zapis stanu edytora (calendar.layoutJson)           | pending      | 011, 036   |
| 038 | Trigger eksportu PDF                                | pending      | 037        |
| 039 | Renderer PDF (pdf-lib)                              | pending      | 034, 037   |
| 040 | Strona pobrania PDF + API route                     | pending      | 039        |
| 041 | Worker kolejki PDF                                  | pending      | 020, 039   |
| 042 | Admin dashboard kosztów OpenAI                      | pending      | 013        |
| 043 | BullBoard — UI monitorowania kolejek                | pending      | 019        |
| 044 | Promowanie usera do admina (CLI)                    | pending      | 006        |
| 045 | Production Dockerfile (multi-stage)                 | pending      | 004        |
| 046 | Production Dockerfile workera                       | pending      | 020, 045   |
| 047 | docker-compose.prod.yml dla Dokploy                 | pending      | 045, 046   |
| 048 | Dokumentacja deploy Dokploy                         | pending      | 047        |
| 049 | Smoke test produkcji (curl)                         | pending      | 047        |
| 050 | Checklist gotowości produkcyjnej                    | pending      | 001, 048, 049 |
