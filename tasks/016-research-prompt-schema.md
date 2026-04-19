---
id: 016
title: Prompt builder i schema researchu miesiąca
type: feat
status: done
depends_on: [015]
touches:
  - src/lib/openai/research.ts
  - src/lib/openai/schemas/month-plan.ts
  - src/lib/openai/__tests__/research.test.ts
  - src/lib/openai/__tests__/__snapshots__/research.test.ts.snap
  - vitest.config.ts
  - package.json
  - tasks/verify/016.sh
---

## Cel

Zdefiniować strukturę promptu researchu (FR-4) i JSON Schema dla structured output, żeby wynik researchu mapował się 1:1 na pola `day` (task 012).

## Zakres (DO)

- [ ] `src/lib/openai/schemas/month-plan.ts` — Zod schema + `z.toJSONSchema`:
  ```ts
  import { z } from 'zod'
  export const MonthPlanSchema = z.object({
    year: z.number(),
    month: z.number(),
    daysInMonth: z.number(),
    days: z.array(z.object({
      day: z.number(),
      weekday: z.enum(['pon','wt','sr','czw','pt','sob','nd']),
      occasion: z.string().nullable(),
      motif: z.string(),
      sources: z.array(z.string().url()),
    })),
    seriesNotes: z.string().nullable(),
  })
  export type MonthPlan = z.infer<typeof MonthPlanSchema>
  ```
- [ ] `src/lib/openai/research.ts`:
  - `buildResearchPrompt(year: number, month: number): string` — generuje polski prompt opisany w skill `miesieczny-kalendarz-kolorowanek/SKILL.md` (Etap 1). Ma wymuszać: liczba dni, polskie święta państwowe, ruchome uroczystości katolickie, sezonowe okazje, odrzucone alternatywy, priorytety z skilla.
  - `parseMonthPlan(raw: unknown): MonthPlan` — valid'uje response przez Zod; rzuca czytelny błąd przy złej strukturze.

## Poza zakresem (DON'T)

- Nie wołaj jeszcze OpenAI (task 018 batch wrapper + task 021 worker).
- Nie dotykaj promptów obrazków (task 017).

## Kryteria akceptacji

- `buildResearchPrompt(2026, 5)` zawiera „Maj 2026", instrukcję po polsku, oczekiwanie structured output.
- `parseMonthPlan` rzuca na brakujące pola.

## Weryfikacja automatyczna

`tasks/verify/016.sh`: vitest — snapshot promptu dla 2026/5, testy schema happy+sad path.

## Weryfikacja manualna

- [ ] `console.log(buildResearchPrompt(2026, 12))` — prompt zawiera wszystkie wymagania z skill SKILL.md Etap 1.

## Notatki dla agenta

- Referencyjny skill: `.agents/skills/miesieczny-kalendarz-kolorowanek/SKILL.md` (w starym drzewie `/home/mmarus03/dump/kolorowanki/.agents/…`). Zajrzyj **koniecznie** — tam jest autoratywny opis co research ma zwrócić.
- Structured outputs: OpenAI Responses API przyjmuje `response_format: { type: 'json_schema', json_schema: {...} }` — przekaż `z.toJSONSchema(MonthPlanSchema)`.
- `web_search` tool musi być w liście tools requesta (patrz task 018 wrapper).
