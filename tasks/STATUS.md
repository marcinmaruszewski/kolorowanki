# Status tasków

Autogenerowane przez `./scripts/task list` i aktualizowane przez `./scripts/task done <id>`. Nie edytuj ręcznie.

| ID  | Tytuł                                               | Status       | Depends on |
| --- | --------------------------------------------------- | ------------ | ---------- |
| 001 | Zainicjalizuj repozytorium i pliki bazowe           | done         |            |
| 002 | Utwórz package.json i tsconfig bazowy (bez instala | done         | 001        |
| 003 | Postaw Postgres i Redis przez docker-compose        | done         | 001        |
| 004 | Skonteneryzuj aplikację (Dockerfile + usługa app  | done         | 002, 003   |
| 005 | Zainstaluj Payload v3 + Next.js w kontenerze        | done         | 004        |
| 006 | Skonfiguruj kolekcję users z bazowymi polami       | done         | 005        |
| 007 | Przygotuj konfigurację OAuth w Google Cloud Consol | done         | 006        |
| 008 | Zaimplementuj Google OAuth strategy i callback      | done         | 007        |
| 009 | Zaimplementuj dev-login backdoor do testów         | done         | 008        |
| 010 | Egzekwuj limit 1 kalendarza/miesiąc + cron reset   | done         | 009        |
| 011 | Utwórz kolekcję calendars                         | done         | 010        |
| 012 | Utwórz kolekcję days z relacją do calendars      | done         | 011        |
| 013 | Utwórz kolekcję generationJobs                    | done         | 011        |
| 014 | Skonfiguruj kolekcję media z lokalnym storage na v | done         | 011        |
| 015 | Skonfiguruj klienta OpenAI i env vars               | done         | 005        |
| 016 | Prompt builder i schema researchu miesiąca         | done         | 015        |
| 017 | Prompt builder dla obrazków dziennych              | done         | 015        |
| 018 | Wrapper OpenAI Batch API (submit + poll + parse)    | done         | 015        |
| 019 | Skonfiguruj BullMQ + Redis connection               | done         | 003, 005   |
| 020 | Dodaj kontener worker do docker-compose             | done         | 019        |
| 021 | Worker researchu — submit batch, poll, zapisz day | done         | 012, 013, 016, 018, 020 |
| 022 | Worker obrazków batch — submit, poll, zapisz PNG | done         | 014, 017, 018, 021 |
| 023 | Worker regeneracji pojedynczego dnia (realtime, bez | done         | 022        |
| 024 | Strona logowania (PL) z przyciskiem Google          | done         | 008        |
| 025 | Layout aplikacyjny + nawigacja auth-aware           | done         | 024        |
| 026 | Strona listy moich kalendarzy                       | done         | 011, 025   |
| 027 | Kreator nowego kalendarza (wybór roku i miesiąca) | done         | 021, 026   |
| 028 | Strona planu kalendarza (read-only) z pollingiem st | done         | 021, 027   |
| 029 | Edycja planu (okazja, motyw) przed generacją obraz | done         | 028        |
| 030 | Akceptacja planu — trigger batch generacji obrazk | done         | 022, 029   |
| 031 | Galeria wygenerowanych obrazków (grid 7 kolumn)    | done         | 022, 030   |
| 032 | Modal regeneracji pojedynczego dnia (prompt overrid | done         | 023, 031   |
| 033 | Licznik pozostałych regeneracji i ostrzeżenia     | done         | 032        |
| 034 | Port algorytmu build_slots() z Pythona do TypeScrip | done         | 002        |
| 035 | Strona edytora fabric.js (A4 canvas + załadowanie  | done         | 031, 034   |
| 036 | Interakcje fabric.js — drag, rotate, scale, dupli | done         | 035        |
| 037 | Zapis stanu edytora do DB (calendar.layoutJson)     | done         | 011, 036   |
| 038 | Trigger eksportu PDF z edytora                      | done         | 037        |
| 039 | Renderer PDF (pdf-lib) z layoutJson                 | done         | 034, 037   |
| 040 | Strona pobrania PDF + API route                     | done         | 039        |
| 041 | Worker kolejki PDF (renderuje + zapisuje media)     | done         | 020, 039   |
| 042 | Admin dashboard kosztów OpenAI                     | done         | 013        |
| 043 | BullBoard — UI do monitorowania kolejek BullMQ    | pending      | 019        |
| 044 | Promowanie usera do roli admin (CLI script)         | pending      | 006        |
| 045 | Production Dockerfile (multi-stage, next build)     | pending      | 004        |
| 046 | Production Dockerfile dla workera                   | pending      | 020, 045   |
| 047 | docker-compose.prod.yml dla Dokploy                 | pending      | 045, 046   |
| 048 | Dokumentacja deploy na Dokploy                      | pending      | 047        |
| 049 | Skrypt smoke test produkcji (curl + login)          | pending      | 047        |
| 050 | Checklist gotowości produkcyjnej                   | pending      | 001, 048, 049 |
