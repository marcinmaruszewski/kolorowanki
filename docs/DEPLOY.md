# Deploy na Dokploy

Instrukcja krok-po-kroku wdrożenia aplikacji Kalendarz na Dokploy.
Zakłada, że masz działający serwer z zainstalowanym Dokploy (https://docs.dokploy.com).

---

## 1. Wymagania wstępne

- Serwer z zainstalowanym **Dokploy** (min. 2 GB RAM, 20 GB dysk)
- Domena `kolorowanki.marcinmaruszewski.me` z wpisem DNS A → IP serwera
- **Google OAuth** — projekt w Google Cloud Console z redirect URI:
  `https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback`
  (patrz task 007: `docs/` + Google Cloud Console setup)
- Klucz **OpenAI API** z dostępem do `gpt-5.4` i `gpt-image-1.5`
- Dostęp do repozytorium Git z kodem

---

## 2. Tworzenie stacka w Dokploy

1. W panelu Dokploy wybierz **Projects → New Project**.
2. W projekcie kliknij **Create Service → Compose**.
3. Ustaw:
   - **Name**: `kalendarz`
   - **Provider**: GitHub / własne repo
   - **Repository URL**: URL repo
   - **Branch**: `master` (lub `main`)
   - **Compose File**: `docker-compose.prod.yml`
4. Kliknij **Save**.

---

## 3. Zmienne środowiskowe (ENV)

W zakładce **Environment** wklej zmienne i uzupełnij wartości (Dokploy zapisuje je do `.env` — `docker-compose.prod.yml` odczytuje je przez `${VAR}`):

```
POSTGRES_USER=kalendarz
POSTGRES_PASSWORD=<silne-haslo>
DATABASE_URL=postgres://kalendarz:<haslo>@postgres:5432/kalendarz
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_SERVER_URL=https://kolorowanki.marcinmaruszewski.me
PAYLOAD_SECRET=<losowy-ciag-min-32-znaki>
GOOGLE_CLIENT_ID=<z-Google-Cloud-Console>
GOOGLE_CLIENT_SECRET=<z-Google-Cloud-Console>
GOOGLE_REDIRECT_URI=https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback
OPENAI_API_KEY=<klucz-openai>
OPENAI_TEXT_MODEL=gpt-5.4
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

**Nie ustawiaj** `ENABLE_DEV_LOGIN` — w produkcji musi być nieobecne (instrumentation.ts rzuci błąd jeśli jest `true`).

---

## 4. Mapowanie domeny

1. W zakładce **Domains** kliknij **Add Domain**.
2. Ustaw:
   - **Domain**: `kolorowanki.marcinmaruszewski.me`
   - **Service**: `app`
   - **Port**: `3000`
   - **HTTPS**: włączone (Dokploy/Traefik obsłuży SSL automatycznie)
3. Zapisz — Dokploy wygeneruje certyfikat Let's Encrypt.

---

## 5. Volumes (media i postgres)

Docker Compose definiuje named volumes `postgres_data`, `redis_data` i `media`. Dokploy zarządza nimi automatycznie — nie musisz nic konfigurować ręcznie.

Jeśli chcesz **backup danych** lub zamontować zewnętrzny dysk, zmień definicję `media` i `postgres_data` w `docker-compose.prod.yml` na bind-mount do wybranej ścieżki na hoście, np.:

```yaml
volumes:
  media:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/kolorowanki/media
```

---

## 6. Cron jobs (reset limitu miesięcznego)

Reset limitu kalendarzy (task 010) jest realizowany przez wbudowany cron w aplikacji Next.js (`src/jobs/quota-reset-cron.ts`) — uruchamia się automatycznie przy starcie kontenera `app`, nie wymaga zewnętrznej konfiguracji.

Alternatywnie możesz skonfigurować cron w Dokploy:
- **Schedule**: `0 0 1 * *` (pierwszy dzień miesiąca, 00:00)
- **Command**: `docker exec $(docker ps -qf name=kalendarz_app) node -e "require('./scripts/reset-quota')"`

---

## 7. Pierwsza promocja admina

Po pierwszym logowaniu przez Google (task 008) Twoje konto ma domyślną rolę `user`. Aby nadać sobie rolę `admin`:

```bash
docker exec -it <nazwa-kontenera-app> tsx scripts/promote-admin.ts --email=kontakt@marcinmaruszewski.me
```

Nazwę kontenera sprawdzisz przez `docker ps`. Możesz też użyć:

```bash
docker compose -f docker-compose.prod.yml exec app tsx scripts/promote-admin.ts --email=kontakt@marcinmaruszewski.me
```

Więcej szczegółów: [docs/AGENTS.md — sekcja „Promowanie admin"](AGENTS.md).

---

## 8. Smoke test po deploy

Po wdrożeniu uruchom skrypt weryfikacyjny (task 049):

```bash
PROD_URL=https://kolorowanki.marcinmaruszewski.me ./tasks/verify/049.sh
```

Sprawdza: HTTP 200 na stronie głównej, redirect na `/login` bez sesji, dostępność endpointu health.

---

## Aktualizacja aplikacji

1. Push do brancha `master` / `main`.
2. W Dokploy kliknij **Deploy** (lub włącz auto-deploy po push).
3. Dokploy przebuduje obrazy i zrestartuje kontenery z zero-downtime (jeśli skonfigurowano health checks).
