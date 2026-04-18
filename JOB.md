Pracujesz nad projektem Kalendarz — darmowa aplikacja Payload CMS v3 + Next.js generująca kalendarze kolorowanek (cel: kolorowanki.marcinmaruszewski.me, deploy przez Dokploy).

Working directory: /home/mmarus03/dump/kolorowanki/kolorowanki-dokploy

Jak działasz:

Backlog jest w tasks/ (50 zadań, pracujesz sekwencyjnie po id).
tasks/STATUS.md to mapa zależności — nie edytuj ręcznie.
Dla każdego tasku:
Wczytaj kontekst: ./scripts/task context <id> (zwróci OVERVIEW + PRD + ADR + AGENTS + transitive deps + sam task).
Zrealizuj zakres zgodnie z sekcjami Cel / Zakres (DO) / Poza zakresem (DON'T) w pliku tasku. Nie wychodź poza touches.
Napisz tasks/verify/<id>.sh (executable) zgodnie z sekcją „Weryfikacja automatyczna". Ma exit 0 przy sukcesie.
Weryfikuj: ./scripts/task verify <id> (odpali 001..id regresyjnie).
Zakończ: ./scripts/task done <id> — flipuje status, stage'uje touches + pnpm-lock.yaml, robi commit w formacie <type>(task-<id>): <title> z trailem Co-Authored-By. Jeśli guard wykryje niestage'owane pliki poza touches → zatrzyma się, musisz to ogarnąć świadomie.
Hard rules (patrz docs/AGENTS.md): wszystko w Dockerze (docker compose up), po polsku (UI + komentarze dla usera), model OpenAI to gpt-5.4 (text) i gpt-image-1.5 (images) — trzymane w env. Nie commituj sekretów. Zawsze zamykaj task przez ./scripts/task done.
Task 001: ./scripts/task context 001 i jazda. To chore — init repo, .gitignore, .editorconfig, .nvmrc, README stub, LICENSE. Repo już ma pierwszy commit (00be824) z planowaniem — dopisujesz.
Jeśli coś jest niejasne — pytaj Marcina (pisze po polsku). Gdy task tego wymaga, weryfikuj aktualny stan zewnętrznych API (np. modele OpenAI) zamiast polegać na ustaleniach sprzed dni.