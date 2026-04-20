Pracujesz nad projektem Kalendarz — darmowa aplikacja Payload CMS v3 + Next.js generująca kalendarze kolorowanek (cel: kolorowanki.marcinmaruszewski.me, deploy przez Dokploy).

Working directory: /home/mmarus03/dump/kolorowanki/kolorowanki-dokploy

Jak działasz:

Backlog jest w tasks/ (50 zadań, pracujesz sekwencyjnie po id).
tasks/STATUS.md to mapa zależności — nie edytuj ręcznie.
Dla każdego tasku:
Wczytaj kontekst: ./scripts/task context <id> (zwróci OVERVIEW + PRD + ADR + AGENTS + TESTING + transitive deps + sam task).
Zrealizuj zakres zgodnie z sekcjami Cel / Zakres (DO) / Poza zakresem (DON'T) w pliku tasku. Nie wychodź poza touches.
Napisz tasks/verify/<id>.sh (executable) zgodnie z sekcją „Weryfikacja automatyczna". Ma exit 0 przy sukcesie.
Pure unit i mockowane integration rób przez vitest w kontenerze Node `app`: `docker compose run --rm app pnpm vitest run ...`. Jeśli test wymaga działającej aplikacji HTTP, najpierw podnieś stack, potem uruchom vitest w żyjącym kontenerze `app`: `docker compose exec -T app pnpm vitest run ...`. Dla UI/smoke używaj `agent-browser`. Jeśli pasuje, korzystaj ze wspólnych helperów z `tasks/verify/_helpers.sh` zamiast kopiować boilerplate.
Nie dokładaj nowych lokalnych verify-flow opartych o `curl`, cookie-jary, PID-y, `wait` ani ręczny polling localhost, jeśli ten sam dowód da się zrobić przez vitest albo agent-browser.
Jeśli test dotyka bazy, sesji albo Redisa, zacznij verify od czystego resetu projektu: `docker compose down -v --remove-orphans`. Nie używaj globalnego `docker volume prune`.
W trakcie implementacji rób szybkie checki celowane, ale przed zamknięciem taska uruchom pełne: ./scripts/task verify <id>.
Zakończ: ./scripts/task done <id> — flipuje status, stage'uje touches + pnpm-lock.yaml i robi commit w formacie <type>(task-<id>): <title>. Jeśli guard wykryje niestage'owane pliki poza touches → zatrzyma się, musisz to ogarnąć świadomie.
Hard rules (patrz docs/AGENTS.md i docs/TESTING.md): wszystko w Dockerze (`docker compose run` / `exec` / `up`), po polsku (UI + komentarze dla usera), model OpenAI to gpt-5.4 (text) i gpt-image-1.5 (images) — trzymane w env. Nie commituj sekretów. Zawsze zamykaj task przez ./scripts/task done.
Zaczynaj od taska wskazanego przez usera albo z bieżącego kontekstu sesji. `Task 001` był historycznym bootstrapem repo i nie jest domyślnym punktem startu dla każdego nowego agenta.
Jeśli coś jest niejasne — pytaj Marcina (pisze po polsku). Gdy task tego wymaga, weryfikuj aktualny stan zewnętrznych API (np. modele OpenAI) zamiast polegać na ustaleniach sprzed dni.
