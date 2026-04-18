# ADR — Decyzje architektoniczne

Plik append-only. Nowe decyzje dodawać na końcu, istniejących nie modyfikować (jeśli decyzja jest anulowana — dodać nową z `Status: Superseded by ADR-XXX` i opisać w nowej dlaczego).

Format każdej decyzji:

```
## ADR-XXX: Tytuł
- Status: Accepted | Superseded by ADR-YYY | Deprecated
- Data: YYYY-MM-DD
- Kontekst: …
- Decyzja: …
- Konsekwencje: …
- Alternatywy odrzucone: …
```

---

## ADR-001: Payload v3 + Next.js App Router w jednym repo
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Potrzebna jest webówka z CMS-em do zarządzania użytkownikami, kalendarzami i mediami + custom frontem do edytora i flow generacji.
- Decyzja: Używamy **Payload v3** zintegrowany z Next.js App Router (oficjalny template `payload` z `create-payload-app`). Jedno repo, jeden deployment.
- Konsekwencje: Admin UI out-of-the-box. Custom UI pisany w Next.js App Router w tym samym repo, współdzieli sesję z Payload. Musimy używać wzorca integracyjnego Payload v3 (route handlery w `app/(payload)`).
- Alternatywy odrzucone: Strapi (słabsze TS DX), osobny backend + frontend (podwójna kompleksowość dla solo projektu).

## ADR-002: Postgres zarówno w dev jak i prod (bez SQLite)
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Payload v3 wspiera Postgres i SQLite przez różne adaptery. Rozważaliśmy SQLite lokalnie dla prostoty.
- Decyzja: **Postgres 16** w obu środowiskach, uruchamiany lokalnie przez `docker-compose`. Adapter: `@payloadcms/db-postgres`.
- Konsekwencje: Idealny parity dev↔prod. Wymaga Dockera lokalnie (akceptowalne). Jedna ścieżka migracji.
- Alternatywy odrzucone: SQLite lokalnie + Postgres prod (dwa adaptery, ryzyko rozjazdu schema).

## ADR-003: Kolejka zadań — BullMQ + Redis
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Generowanie kalendarza to długo działający pipeline z pollingiem OpenAI Batch API. Potrzebna kolejka z retry, scheduling, dashboardem.
- Decyzja: **BullMQ** (Node) + **Redis 7** jako serwis w docker-compose. Worker jako osobny kontener (`worker`) obok `app`.
- Konsekwencje: Trzeci serwis w stacku (poza `app`, `postgres`). Dojrzały ekosystem, dobre narzędzia (BullBoard dla adminów). Jobs persistują w Redis — jeśli Redis padnie i nie ma persistence, tracimy kolejkę (akceptowalne — jobs są restartowalne).
- Alternatywy odrzucone: **pg-boss** (jedna usługa mniej, ale słabsze dashboardy i mniej wzorców dla webhooków); **Inngest self-hosted** (młodszy, większa złożoność).

## ADR-004: OpenAI Batch API dla researchu i generacji obrazków
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Pipeline generuje ~30 obrazków + 1 research call per kalendarz. Batch API oferuje 50% zniżki i turnaround typowo 10–15 min.
- Decyzja: Wszystkie wywołania planowego pipeline'u idą przez **Batch API** (`/v1/responses` dla researchu, `/v1/images/generations` dla obrazków). Pojedyncza regeneracja dnia po wygenerowaniu kalendarza idzie realtime (non-batch) dla lepszego UX.
- Konsekwencje: Koszt 1 kalendarza <$1. User czeka 10–15 min na plan i kolejne 10–15 min na obrazki — akceptowalne, bo kalendarz się robi raz/mc.
- Alternatywy odrzucone: Realtime wszędzie (2× droższe, ale szybsze — niepotrzebne).

## ADR-005: Modele OpenAI — `gpt-5.4` i `gpt-image-1.5`
- Status: Accepted
- Data: 2026-04-18
- Kontekst: W kwietniu 2026 OpenAI ma GA: `gpt-5.4` (tekst, flagowy) i `gpt-image-1.5` (obraz, 4× szybszy od `gpt-image-1`, lepszy rendering tekstu wewnątrz obrazu). DALL·E 2/3 deprecated (koniec wsparcia 2026-05-12). `gpt-image-2` jeszcze w beta.
- Decyzja: Domyślnie `OPENAI_TEXT_MODEL=gpt-5.4` i `OPENAI_IMAGE_MODEL=gpt-image-1.5`. Oba trzymane jako env vars dla łatwej podmiany.
- Konsekwencje: Najlepszy obecny line-art + najbardziej niezawodne wpisywanie daty w obraz (krytyczne dla naszego use case). Gdy `gpt-image-2` wyjdzie GA, podmieniamy env.
- Alternatywy odrzucone: `dall-e-3` (deprecated), `gpt-image-1` (wolniejszy, słabszy tekst), `gpt-image-2` (nie GA).

## ADR-006: Storage plików — lokalny filesystem na volume Dokploy
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Potrzebujemy trzymać wygenerowane PNG (~1 MB × 30 × N kalendarzy) i PDF-y.
- Decyzja: Lokalny filesystem kontenera `app`, montowany jako named volume `media` w docker-compose. Payload używa domyślnego `localFilePath` storage w kolekcji `media`.
- Konsekwencje: Zero zewnętrznych zależności. Backup = backup volume'a Dokploy. Jeśli appka przeniesie się na wiele node'ów, trzeba przejść na S3 — ale to poza MVP.
- Alternatywy odrzucone: S3/R2 (niepotrzebny koszt i kompleksowość dla solo projektu na jednym hoście).

## ADR-007: Google OAuth przez custom authStrategy Payloada (bez pluginu)
- Status: Accepted
- Data: 2026-04-18
- Kontekst: Payload v3 wspiera `authStrategies` w kolekcji `users`. Nie ma dojrzałego, oficjalnego pluginu Google OAuth, który nadąża za v3.
- Decyzja: Implementujemy własną strategię: route handler `/api/auth/google/start` i `/api/auth/google/callback`, weryfikacja ID tokena przez `google-auth-library`, zakładanie/znajdowanie usera po `googleSub`, login przez Payload lokalną strategię (wystawienie `payload-token` cookie).
- Konsekwencje: Pełna kontrola nad flow. Więcej kodu do napisania i testowania. Auth Payload nadal działa dla `/admin` (admin może też logować się Google, rola ustawiana ręcznie).
- Alternatywy odrzucone: NextAuth/Auth.js (wymaga integracji z Payload session — overkill); third-party plugin (brak dojrzałego pod v3).

## ADR-008: Edytor A4 — fabric.js w przeglądarce, PDF generowany serwerowo przez pdf-lib
- Status: Accepted
- Data: 2026-04-18
- Kontekst: User musi móc korygować auto-layout (przesuwać, obracać kafelki) i eksportować do druku A4.
- Decyzja: **fabric.js** (ostatnia stabilna wersja) jako canvas editor. Eksport PDF: klient serializuje stan canvas do JSON → serwer odtwarza w `pdf-lib` i renderuje A4. Auto-layout: TS port algorytmu `build_slots()` z Pythona.
- Konsekwencje: Kontrola jakości druku (serwerowy PDF jest deterministyczny, klient jest tylko UI). fabric.js bundle ~300 kB gzip — akceptowalne dla tego ekranu (lazy-loaded).
- Alternatywy odrzucone: Konva (mniej funkcji out-of-the-box); serwerowe renderowanie przez Puppeteer (cięższe niż `pdf-lib` i gorszy kolor druku); klientowy eksport przez `jsPDF` (gorsza jakość przy 300 DPI).
