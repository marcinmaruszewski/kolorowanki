---
id: 037
title: Zapis stanu edytora do DB (calendar.layoutJson)
type: feat
status: pending
depends_on: [011, 036]
touches:
  - src/collections/Calendars.ts
  - src/app/(app)/kalendarz/[id]/edytor/actions.ts
  - src/app/(app)/kalendarz/[id]/edytor/fabric-canvas.tsx
---

## Cel

Pole `layoutJson` (JSON) w kolekcji `calendars`. Przycisk „Zapisz" w edytorze serializuje `canvas.toJSON()` → Server Action → `payload.update calendars`. Przy kolejnym otwarciu edytora — jeśli `layoutJson` istnieje, ładowany zamiast `buildSlots`.

## Zakres (DO)

- [ ] Update kolekcji `Calendars` (task 011) — dodaj pole `{ name: 'layoutJson', type: 'json' }`.
- [ ] Server Action `saveLayout(calendarId, layoutJson)`:
  - guard: owner = current user
  - guard: `calendar.status in ['generated', 'composed']`
  - `payload.update({ collection: 'calendars', id, data: { layoutJson, status: 'composed' } })`
- [ ] `FabricCanvas`: na mount, jeśli `initialLayout` przekazane — `canvas.loadFromJSON(initialLayout)`; inaczej `buildSlots`.
- [ ] Przycisk „Zapisz" w toolbar.

## Poza zakresem (DON'T)

- Autosave — MVP ręczny.

## Kryteria akceptacji

- Zmień układ, zapisz, odśwież stronę → widzisz ten sam układ.

## Weryfikacja automatyczna

`tasks/verify/037.sh`: Playwright — drag, save, reload, assert pozycja.

## Weryfikacja manualna

- [ ] Edytuj + zapisz, odśwież przeglądarkę.

## Notatki dla agenta

- `canvas.toJSON()` zwraca POJO — zapisywalny do Payload `json` field.
- Dodaj migrację bazy po zmianie schema (Payload auto-migrate w dev).
