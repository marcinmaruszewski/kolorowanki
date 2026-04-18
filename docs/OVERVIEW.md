# Kalendarz — opis aplikacji

Darmowa webowa aplikacja do generowania miesięcznych kalendarzy kolorowanek dla dzieci. Zalogowany użytkownik wybiera miesiąc i rok, a system generuje arkusz A4 z 28–31 grafikami line-art (po jednej na dzień), ułożonymi w organicznej mozaice. Każda grafika ma wpisaną datę w motyw (np. na wstążce, listku, chmurce).

## Grupa docelowa

Rodzice, wychowawcy, animatorzy zajęć plastycznych. UI tylko po polsku, kontekst świąt polskich (państwowe + katolickie + sezonowe).

## User flow

1. **Login** — użytkownik loguje się kontem Google.
2. **Nowy kalendarz** — wybiera rok i miesiąc (limit: 1 kalendarz na użytkownika na miesiąc kalendarzowy).
3. **Research + plan** — system (OpenAI `gpt-5.4` + web search, przez Batch API) zbiera polskie święta danego miesiąca i proponuje motyw dla każdego dnia. User akceptuje/edytuje plan.
4. **Generowanie obrazków** — system (OpenAI `gpt-image-1.5`, przez Batch API) tworzy 28–31 plików PNG line-art. Typowy turnaround 10–15 minut.
5. **Galeria** — user przegląda wygenerowane obrazki, może zregenerować pojedynczy dzień (w trybie realtime, poza batchem).
6. **Edytor A4** — fabric.js canvas 210×297 mm. Start z auto-mozaiki (port algorytmu z `compose_month_pdf.py`). User może ręcznie przesuwać, obracać, skalować kafelki, tasować układ.
7. **Export PDF** — renderowanie serwerowe (`pdf-lib`), download.

## Pojęcia w domenie

- **Kalendarz** (`calendar`) — dokument per `(rok, miesiąc, użytkownik)`. Ma status, plan i dni.
- **Dzień** (`day`) — rekord powiązany z kalendarzem, reprezentuje jedną datę (`day: 1..31`). Zawiera: okazję, motyw, prompt do modelu obrazowego, wygenerowany PNG.
- **Series Direction** — wspólne zasady wizualne serii (grubość konturu, stopień detalu, nośnik daty). Ustalane raz per kalendarz.
- **Plan miesiąca** (`month-plan`) — rezultat Etapu 1 workflow: zbiór dni z okazjami + notatki artystyczne.
- **Job generacyjny** (`generationJob`) — rekord trackujący batch OpenAI: typ (`research` / `images` / `singleImage` / `pdf`), `openaiBatchId`, status, koszt.

## Inspiracja: skill CLI

Aplikacja to webowa wersja istniejącego skilla `/home/mmarus03/dump/kolorowanki/.agents/skills/miesieczny-kalendarz-kolorowanek/`. Workflow (Etap 1–5), szablony promptów i algorytm layoutu pochodzą stamtąd i są autoratywnym źródłem dla pytań „jak ma działać generowanie / jak ma wyglądać output".

## Co aplikacja NIE robi

- Nie ma płatności, nie ma planów pro, nie ma API zewnętrznego.
- Nie ma galerii publicznych (kalendarze są prywatne).
- Nie ma wersjonowania kalendarzy (tylko ostatni stan, pojedyncze dni można regenerować).
- Nie ma wielu języków — wyłącznie polski.
- Nie ma watermarków ani brandingu w eksportowanym PDF.
- Nie generuje innych formatów niż A4 pionowy.
