---
id: 043
title: BullBoard — UI do monitorowania kolejek BullMQ
type: feat
status: pending
depends_on: [019]
touches:
  - src/app/(payload)/admin/queues/[[...slug]]/route.ts
  - package.json
---

## Cel

Zamontuj `@bull-board/api` + `@bull-board/express` na ścieżce `/admin/queues` (za auth adminem).

## Zakres (DO)

- [ ] `pnpm add @bull-board/api @bull-board/express express`.
- [ ] Route handler Next `app/(payload)/admin/queues/[[...slug]]/route.ts`:
  - auth guard: `getCurrentUser()` + role='admin' → w innym razie 403
  - lazy init bullboard (singleton) z 4 kolejkami
  - proxy do express app via `createNodeAdapter`
- [ ] Link „Kolejki" w topbar admin.

## Poza zakresem (DON'T)

- Własne UI — bullboard wystarcza.

## Kryteria akceptacji

- Admin otwiera `/admin/queues` i widzi 4 kolejki z jobami.

## Weryfikacja automatyczna

`tasks/verify/043.sh`: Playwright — admin login, assert obecność UI.

## Weryfikacja manualna

- [ ] Sprawdź, czy liczba jobów rośnie po stworzeniu kalendarza.

## Notatki dla agenta

- BullBoard w Next app router jest tricky — rozważ prostszy patch: serwuj przez `handler(req.nextUrl.pathname.replace('/admin/queues',''))`.
- Alternatywa: odpal bullboard jako osobny kontener na innym porcie (nie zalecam dla MVP).
