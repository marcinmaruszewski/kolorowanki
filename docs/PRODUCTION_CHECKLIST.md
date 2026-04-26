# Checklist gotowości produkcyjnej

Odfajkuj każdy punkt **przed** ogłoszeniem MVP live na `kolorowanki.marcinmaruszewski.me`.

---

## Taski i kod

- [ ] Wszystkie taski 001–049 mają status `done` (`cat tasks/STATUS.md`)
- [ ] Brak uncommitted zmian w repo (`git status` clean)
- [ ] Branch `master`/`main` wypchnięty na zdalne repo

---

## Konfiguracja środowiska

- [ ] `ENABLE_DEV_LOGIN` **nie jest ustawione** w Dokploy ENV (lub `false`) — weryfikacja przez `instrumentation.ts`
- [ ] `PAYLOAD_SECRET` to losowy ciąg min. 32 znaki (np. `openssl rand -base64 32`)
- [ ] `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` z produkcyjnego projektu Google Cloud Console
- [ ] `GOOGLE_REDIRECT_URI` wskazuje na `https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback`
- [ ] `OPENAI_API_KEY` z ustawionym spending limit w OpenAI dashboard
- [ ] `DATABASE_URL` wskazuje na wewnętrzną sieć Docker (`postgres:5432`), nie na localhost

---

## Deploy i infrastruktura

- [ ] Stack Dokploy zbudowany i uruchomiony (`docker compose -f docker-compose.prod.yml ps` — wszystkie serwisy `running`)
- [ ] Domena `kolorowanki.marcinmaruszewski.me` rozwiązuje się poprawnie (`nslookup`)
- [ ] Certyfikat SSL aktywny (Dokploy/Traefik Let's Encrypt) — zielona kłódka w przeglądarce
- [ ] Named volume `postgres_data` i `media` widoczne w Dokploy Volumes
- [ ] Postgres backups skonfigurowane (Dokploy backup lub zewnętrzne)
- [ ] Volume `media` z backup strategy (Dokploy snapshot lub rsync)

---

## Weryfikacja funkcjonalna

- [ ] Smoke test przeszedł: `PROD_URL=https://kolorowanki.marcinmaruszewski.me ./scripts/smoke-prod.sh`
- [ ] Google OAuth login działa (Marcin loguje się kontem Google)
- [ ] Pierwszy user promowany do admina: `docker compose exec app tsx scripts/promote-admin.ts --email=kontakt@marcinmaruszewski.me`
- [ ] Dostęp do Payload Admin UI: `https://kolorowanki.marcinmaruszewski.me/admin`
- [ ] BullBoard dostępny dla admina: `https://kolorowanki.marcinmaruszewski.me/admin/queues`
- [ ] Limit kalendarzy aktywny (próba drugiego kalendarza w tym samym miesiącu → błąd)
- [ ] Cron reset quoty skonfigurowany (weryfikacja logiem pierwszego dnia miesiąca lub ręczne wywołanie)

---

## Test e2e (kompletny flow)

- [ ] Login → Create calendar (wybór roku/miesiąca)
- [ ] Research batch uruchomiony i plan wygenerowany (~10–15 min)
- [ ] Edycja planu (okazja/motyw per dzień) i akceptacja
- [ ] Batch generacji obrazków ukończony (~15 min)
- [ ] Galeria wyświetla 28–31 obrazków
- [ ] Regeneracja pojedynczego dnia działa
- [ ] Edytor fabric.js ładuje się, drag/rotate/scale działa
- [ ] Export PDF pobiera plik A4

---

## Monitoring i observability

- [ ] Logi aplikacji zbierane przez Dokploy (widoczne w zakładce Logs)
- [ ] Dashboard kosztów OpenAI dostępny: `/admin/koszty`
- [ ] Spending limit w OpenAI dashboard ustawiony (budżet miesięczny)

---

## Beta test

- [ ] Marcin przeszedł kompletny flow jako użytkownik końcowy
- [ ] Opcjonalnie: jeden beta-tester z zewnątrz potwierdził działanie flow

---

**Wszystkie punkty odfajkowane → MVP gotowe do ogłoszenia.**
