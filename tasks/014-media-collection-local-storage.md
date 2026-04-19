---
id: 014
title: Skonfiguruj kolekcję media z lokalnym storage na volume
type: feat
status: done
depends_on: [011]
touches:
  - src/payload/collections/media.ts
  - src/payload.config.ts
  - src/payload-types.ts
  - docker-compose.yml
  - tasks/verify/014.sh
---

## Cel

Skonfigurować kolekcję `media` (ADR-006) — lokalny filesystem na persistent volume. Tu trafiają PNG dni + eksportowane PDF-y.

## Zakres (DO)

- [ ] `src/payload/collections/media.ts`:
  - `slug: 'media'`
  - `upload: { staticDir: path.resolve(__dirname, '../../../media'), mimeTypes: ['image/png', 'image/jpeg', 'application/pdf'] }`
  - `access`: read publicznie (pliki są serwowane przez Next static), create/update/delete — server-side (workery), admin
  - pola: `alt` (text, opcjonalne), `calendar` (relationship → calendars, opcjonalne — wiążemy media z kalendarzem dla cleanup)
- [ ] Zarejestruj w `payload.config.ts`.
- [ ] W `docker-compose.yml` dodaj named volume dla media: `volumes: - media_data:/app/media` w usłudze `app` (poza bind mount'em całego repo dodaj dedykowany volume dla `./media`). Zadeklaruj `media_data` na dole pliku. W dev może być bind mount (`./media:/app/media`), w prod named volume — override w osobnym tasku deploymentowym (046).
- [ ] Dodaj `media/` do `.gitignore` (było w tasku 001, upewnij się).

## Poza zakresem (DON'T)

- Nie konfiguruj S3/R2 ani chmurowego storage.
- Nie dodawaj image transforms (Payload `imageSizes`) — MVP nie potrzebuje.

## Kryteria akceptacji

- Upload przez Admin UI działa, plik trafia do `./media/` na hoście (przez bind mount).
- URL `http://localhost:3000/api/media/<id>` serwuje plik.
- Restart compose nie kasuje plików.

## Weryfikacja automatyczna

`tasks/verify/014.sh`: tsc, upload test przez Vitest.

## Weryfikacja manualna

- [ ] Admin UI → Media → Upload PNG → plik istnieje w `./media/`.
- [ ] `docker compose down && docker compose up -d` → plik nadal jest.

## Notatki dla agenta

- Payload v3 wrzuca pliki relatywnie do `staticDir`. `path.resolve(__dirname, '../../../media')` ląduje w `/app/media` w kontenerze = `./media` na hoście (bind mount).
- Nie włączaj `disableLocalStorage: true` — ADR-006 mówi wprost: local storage.
