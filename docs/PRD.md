# PRD — Kalendarz

## Cel produktu

Umożliwić polskojęzycznym rodzicom/wychowawcom wygenerowanie jednego spersonalizowanego arkusza A4 z miesięcznymi kolorowankami dla dzieci w ciągu kilkunastu minut, bez żadnych kosztów dla użytkownika i bez konieczności korzystania z CLI.

## Wymagania funkcjonalne (MVP)

### FR-1. Uwierzytelnianie
- FR-1.1. Logowanie wyłącznie przez Google OAuth.
- FR-1.2. Pierwsze logowanie automatycznie zakłada konto z rolą `user`.
- FR-1.3. Admin ustawia rolę `admin` ręcznie przez Payload Admin UI.
- FR-1.4. Brak samodzielnej rejestracji e-mail/hasło. Brak logowania innymi dostawcami OAuth.

### FR-2. Limity
- FR-2.1. User z rolą `user` może utworzyć maksymalnie **1 kalendarz na miesiąc kalendarzowy** (liczony od pierwszego dnia miesiąca kalendarzowego, nie od daty utworzenia poprzedniego kalendarza).
- FR-2.2. Limit jest zerowany codziennie przez cron sprawdzający, czy jest pierwszy dzień miesiąca.
- FR-2.3. Role `admin` nie podlega limitom.
- FR-2.4. Regeneracja pojedynczego obrazka w istniejącym kalendarzu **nie** zużywa limitu.

### FR-3. Tworzenie kalendarza
- FR-3.1. User wybiera rok (bieżący lub następny) i miesiąc.
- FR-3.2. Nie można utworzyć kalendarza dla (rok, miesiąc), który już istnieje dla tego usera.
- FR-3.3. Utworzenie kalendarza zleca batch `research` w OpenAI.

### FR-4. Research i plan
- FR-4.1. Research używa `gpt-5.4` z narzędziem web search; pyta o: liczbę dni miesiąca, dni tygodnia, święta państwowe PL, ruchome uroczystości katolickie, sezonowe okazje.
- FR-4.2. Wynik jest parsowany do struktury: `{ day, weekday, occasion, motif, sources[] }` per dzień.
- FR-4.3. User widzi plan w tabeli edytowalnej; może zmieniać `occasion` i `motif` per dzień przed akceptacją.
- FR-4.4. Kalendarz przechodzi w status `planned` po akceptacji.

### FR-5. Generowanie obrazków
- FR-5.1. Po akceptacji planu system submit'uje batch `images` z 28–31 promptami do `gpt-image-1.5`.
- FR-5.2. Prompt per dzień jest konstruowany z szablonu `references/image-prompt-template.md` + wspólnego `seriesDirection`.
- FR-5.3. System odpytuje status batcha co 30 s; po zakończeniu zapisuje PNG do filesystem volume i linkuje do `days`.
- FR-5.4. Kalendarz przechodzi w status `generated`.

### FR-6. Regeneracja pojedynczego dnia
- FR-6.1. Po statusie `generated` user może edytować prompt pojedynczego dnia i kliknąć „Regeneruj".
- FR-6.2. Regeneracja pojedynczego dnia idzie realtime (`/v1/images/generations` bez batcha), żeby user nie czekał 15 min.
- FR-6.3. Regeneracja zastępuje poprzedni PNG i aktualizuje `prompt` w `day`.
- FR-6.4. Limit regeneracji per kalendarz: **20** (żeby nie generować kosztów poza limitem miesięcznym).

### FR-7. Edytor A4
- FR-7.1. Canvas fabric.js 210×297 mm w podglądzie (skalowany do okna przeglądarki), renderowany na A4 w 300 DPI przy eksporcie.
- FR-7.2. Layout startowy generowany przez port `build_slots()` z Pythona; 5 kolumn, organiczne offsety i rotacje.
- FR-7.3. User może: przesuwać, skalować, obracać każdy kafelek; „potasuj layout" (regeneruje auto-mozaikę); „reset" (wróć do startowego layoutu).
- FR-7.4. Automatyczne cropowanie białych marginesów każdego PNG przed umieszczeniem (analogicznie do `crop_white_border`).
- FR-7.5. Stan edytora jest zapisywany do kalendarza przy każdej zmianie (debounce 1 s).

### FR-8. Eksport PDF
- FR-8.1. PDF generowany serwerowo (`pdf-lib`), rozmiar A4, pojedyncza strona.
- FR-8.2. Nazwa pliku: `kalendarz-<rok>-<miesiac>.pdf`.
- FR-8.3. Brak watermarków, brak podpisów pod kafelkami (data jest wewnątrz grafiki).
- FR-8.4. PDF zapisywany do volume, dostępny do pobrania przez signed URL ważny 24h.

### FR-9. Panel administracyjny
- FR-9.1. Payload Admin UI pod `/admin`, dostępny tylko dla roli `admin`.
- FR-9.2. Admin widzi wszystkie kolekcje (users, calendars, days, generationJobs, media).
- FR-9.3. Admin może zmieniać role, kasować kalendarze, oglądać koszty batchów.

## Wymagania niefunkcjonalne

- NFR-1. **Hosting**: Dokploy (docker-compose) na własnej maszynie.
- NFR-2. **Dostępność**: best-effort, brak SLA.
- NFR-3. **Bezpieczeństwo**: sekrety tylko w env, cookies HttpOnly/Secure, HTTPS wymuszane przez Dokploy (Let's Encrypt).
- NFR-4. **Koszty OpenAI**: plan: Batch API (50% zniżki) wszędzie gdzie można. Szacowany koszt 1 kalendarza: <$1.
- NFR-5. **UI**: tylko polski. System units mm/A4.
- NFR-6. **Storage**: lokalny filesystem, volume Dokploy. Brak zewnętrznych storage.
- NFR-7. **Retencja**: kalendarze i PDF-y nie są kasowane automatycznie. User może skasować własny kalendarz.

## Poza scope'em MVP

- Płatności, plany pro, kody promocyjne.
- Inne języki niż polski.
- Publiczne galerie, udostępnianie linkiem.
- Wersjonowanie (historia zmian kalendarza).
- Inne formaty niż A4 pionowy.
- Eksport do PNG zbiorczego, do SVG, do JPG.
- Mobile app.
- Personalizacja (imię dziecka w kalendarzu, dedykacja, etc.).
- Logowanie innymi dostawcami OAuth.
- API publiczne.
- Webhooks, integracje.

## Metryki sukcesu (post-launch)

- M-1. Conversion signup → pierwszy wygenerowany PDF > 40%.
- M-2. Średni czas od login do pobranego PDF < 25 min.
- M-3. Błąd batcha OpenAI < 5% prób.
- M-4. Brak regresji: weryfikacja tasków w CI zielona przed każdym merge do `main`.
