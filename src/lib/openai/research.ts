import { z } from 'zod'
import { MonthPlanSchema, type MonthPlan } from './schemas/month-plan'

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

export function buildResearchPrompt(year: number, month: number): string {
  const monthName = POLISH_MONTHS[month - 1]
  return `Jesteś ekspertem od polskiego kalendarza i tworzysz plan miesięcznego kalendarza kolorowanek dla dzieci.

## Zadanie

Zbadaj online i przygotuj kompletny plan dla **${monthName} ${year}** (miesiąc ${month}/${year}).

## Co musisz ustalić (weryfikuj online, nie polegaj na pamięci)

1. **Dokładna liczba dni** w ${monthName} ${year} — potwierdź online.
2. **Dzień tygodnia** dla każdej daty (1–N), gdzie N = liczba dni w miesiącu.
3. **Polskie święta ustawowe** przypadające w tym miesiącu — źródło: gov.pl lub akty prawne.
4. **Najważniejsze uroczystości katolickie i ruchome** (np. Wielkanoc, Boże Ciało, Wszystkich Świętych, Triduum, Zesłanie Ducha Świętego) — źródło: liturgia.wiara.pl lub brewiarz.pl.
5. **Sezonowe i szkolne okazje** (pora roku, zwyczaje, dni tematyczne rozpoznawalne w Polsce).

## Priorytety i filtrowanie okazji

Stosuj następujący porządek priorytetów:
1. Święta ustawowe i najważniejsze uroczystości religijne.
2. Silne zwyczaje lokalne i polskie tradycje (komunia, dożynki, andrzejki itp.).
3. Czytelne, szeroko rozpoznawalne dni tematyczne.

**Pomijaj:** rutynowe wspomnienia świętych, techniczne nazwy kolejnych niedziel okresu liturgicznego, niszowe patronaty bez oczywistego potencjału wizualnego dla dziecka.

**Zostawiaj świętych** tylko wtedy, gdy dana uroczystość jest naprawdę ważna i powszechnie znana w Polsce.

Gdy dzień dotyczy wielkich wydarzeń chrystologicznych (Wielkanoc, Boże Ciało, Miłosierdzie Boże), motyw może wprost przedstawiać prostą, dziecięcą postać Jezusa.

## Motyw dla każdego dnia

Dla każdego dnia wybierz jeden konkretny motyw do kolorowanki:
- Motyw musi być czytelny i atrakcyjny dla dziecka.
- Zadbaj o **różnorodność** — nie powielaj tych samych symboli przez wiele dni z rzędu.
- Gdy brak wyraźnych świąt, sięgaj po: pogodę i przyrodę pory roku, życie szkolne i rodzinne, polskie zwyczaje sezonowe, łagodne motywy przyrodnicze.
- Dla dni bez szczególnej okazji: occasion = null, motif = opis motywu sezonowego/przyrodniczego.

## Wymagania dotyczące źródeł

Dla każdego dnia, gdzie podajesz okazję opartą na konkretnym święcie lub wydarzeniu, **podaj co najmniej jeden URL** do źródła, które to potwierdza. Dla dni bez specjalnej okazji sources może być pustą tablicą.

## Konflikty i odrzucone alternatywy

W polu seriesNotes (string lub null) zapisz:
- wykryte konflikty priorytetów (np. dwa ważne święta tego samego dnia)
- odrzucone alternatywne motywy z uzasadnieniem
- ogólne wskazówki artystyczne spójne dla całego miesiąca ${monthName} ${year}

## Format odpowiedzi

Odpowiedz **wyłącznie** poprawnym JSON zgodnym ze schematem structured output. Nie dodawaj żadnego tekstu poza JSON-em.

Schemat: year (liczba), month (liczba), daysInMonth (liczba), days (tablica obiektów: day, weekday ["pon"|"wt"|"sr"|"czw"|"pt"|"sob"|"nd"], occasion (string|null), motif (string), sources (tablica URLi)), seriesNotes (string|null).

Tablica days musi mieć dokładnie daysInMonth elementów, ponumerowanych od 1 do daysInMonth.`
}

export function parseMonthPlan(raw: unknown): MonthPlan {
  const result = MonthPlanSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Nieprawidłowa struktura planu miesiąca:\n${issues}`)
  }
  return result.data
}
