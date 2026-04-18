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
