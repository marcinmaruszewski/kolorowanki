# CLAUDE.md

Najpierw przeczytaj [docs/AGENTS.md](docs/AGENTS.md) i [docs/TESTING.md](docs/TESTING.md).

`JOB.md` jest live-promptem dla `scripts/claude-job-loop`, więc musi pozostać spójny z tymi dokumentami. Domyślny workflow testów to `vitest` w kontenerze `app` plus `agent-browser` dla UI; nie dokładaj nowych verify-flow opartych o `curl`, cookie-jary, PID-y, `wait` i ręczny polling localhost, jeśli nie są potrzebne.
