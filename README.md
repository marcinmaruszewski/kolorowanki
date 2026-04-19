# Kalendarz

Darmowa webowa aplikacja do generowania miesięcznych kalendarzy kolorowanek dla dzieci (Payload CMS v3 + Next.js, deploy przez Dokploy).

## Dokumentacja

- [Opis produktu](docs/OVERVIEW.md)
- [PRD](docs/PRD.md)
- [ADR — decyzje architektoniczne](docs/ADR.md)
- [AGENTS — zasady pracy agenta](docs/AGENTS.md)
- [Backlog tasków](tasks/)

## Jak zacząć

Cała praca idzie tasko po tasku z katalogu `tasks/`. Do obsługi służy helper:

```bash
./scripts/task list              # tabela wszystkich tasków i ich statusów
./scripts/task context <id>      # pełny briefing: docs + deps + task
./scripts/task verify <id>       # regresja 001..id
./scripts/task done <id>         # flip statusu + auto-commit
```

Szczegóły flow w [docs/AGENTS.md](docs/AGENTS.md).

## Licencja

[MIT](LICENSE) © 2026 Marcin Maruszewski
