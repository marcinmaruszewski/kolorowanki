---
id: 017
title: Prompt builder dla obrazków dziennych
type: feat
status: pending
depends_on: [015]
touches:
  - src/lib/openai/image-prompt.ts
  - src/lib/openai/templates/image-prompt-template.txt
---

## Cel

Zdefiniować builder promptu obrazka (FR-5.2) zgodnie z szablonem z skill `miesieczny-kalendarz-kolorowanek/references/image-prompt-template.md`. Jedna funkcja generuje prompt per dzień z danych `day`.

## Zakres (DO)

- [ ] `src/lib/openai/templates/image-prompt-template.txt` — skopiuj **dosłownie** szablon z `/home/mmarus03/dump/kolorowanki/.agents/skills/miesieczny-kalendarz-kolorowanek/references/image-prompt-template.md` (sekcja „Domyślny szablon", blok ```text```). Zachowaj placeholders `<motyw dnia>`, `<glowny symbol albo mala scenka>`, `DD.MM`.
- [ ] `src/lib/openai/image-prompt.ts`:
  ```ts
  export function buildImagePrompt(args: {
    day: number
    month: number
    occasion: string | null
    motif: string
    seriesDirection: string | null
  }): string
  ```
  - Podmienia placeholders w szablonie
  - Jeśli `seriesDirection` istnieje — prepend jako „Series constraints: …"
  - `DD.MM` = `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}`

## Poza zakresem (DON'T)

- Nie integruj z OpenAI (task 018 + 022).
- Nie modyfikuj treści szablonu — to domena skilla, nie nasza.

## Kryteria akceptacji

- `buildImagePrompt({day:5,month:4,occasion:'Wielkanoc',motif:'koszyk',seriesDirection:null})` zwraca string zawierający `"05.04"` i słowo „koszyk".
- Jeśli `seriesDirection` jest `"grubość konturu 2px"` — prepend'owane.

## Weryfikacja automatyczna

`tasks/verify/017.sh`: vitest — snapshot testy dla kilku kombinacji.

## Weryfikacja manualna

Brak (czysta logika, pokryta testami).

## Notatki dla agenta

- **Skopiuj** szablon z skilla 1:1 — nie poprawiaj literówek, nie upiększaj. To jest design-intent z długich iteracji.
- Nie dokładaj pól do promptu — jeśli coś potrzebne, najpierw zgłoś userowi.
