# AGENTS.md

Repozytoryjne entrypointy dla agentów są w [docs/AGENTS.md](docs/AGENTS.md) i [docs/TESTING.md](docs/TESTING.md).

Nowe taski i verify-skrypty mają domyślnie używać `vitest` w kontenerze `app` oraz `agent-browser` dla UI. Nie dokładaj nowych lokalnych flow opartych o `curl`, PID-y i ręczny polling, jeśli nie są konieczne.
