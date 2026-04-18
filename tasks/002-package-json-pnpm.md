---
id: 002
title: Utwórz package.json i tsconfig bazowy (bez instalacji)
type: chore
status: pending
depends_on: [001]
touches:
  - package.json
  - .npmrc
  - tsconfig.json
---

## Cel

Przygotować pliki konfiguracyjne Node/pnpm/TypeScript zanim powstanie Dockerfile i zanim cokolwiek zostanie zainstalowane. Pliki są celowo tworzone bez uruchomienia `pnpm install` — w modelu Docker-first instalacja żyje w kontenerze (task 005 po postawieniu Dockerfile w 004).

## Kontekst

ADR-001/002/003: Payload v3 + Next.js + Postgres + BullMQ, wszystko w Dockerze. Ten task tylko prepozycjonuje konfigi.

## Zakres (DO)

- [ ] Utwórz `package.json` z polami:
  - `"name": "kalendarz"`
  - `"private": true`
  - `"type": "module"`
  - `"engines": { "node": ">=22 <23" }`
  - `"packageManager": "pnpm@9.12.0"` (lub aktualna stabilna 9.x — patrz https://pnpm.io/)
  - `"scripts": {}` (puste, kolejne taski dopisują)
- [ ] Utwórz `.npmrc` z:
  ```
  auto-install-peers=true
  strict-peer-dependencies=false
  engine-strict=true
  ```
- [ ] Utwórz `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "jsx": "preserve",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "allowJs": false,
      "baseUrl": "."
    },
    "include": ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"],
    "exclude": ["node_modules", ".next", "dist"]
  }
  ```

## Poza zakresem (DON'T)

- Nie instaluj pnpm na hoście. Nie uruchamiaj `pnpm install` ani `corepack enable`. Wszystko później w Dockerze.
- Nie twórz Dockerfile'a (to task 004).
- Nie dodawaj żadnych dependencji w `package.json` (to task 005+).
- Nie twórz `src/`, `tests/` — puste katalogi nie są nam potrzebne.
- Nie konfiguruj ESLint/Prettier (osobny task później).

## Kryteria akceptacji

- `package.json`, `.npmrc`, `tsconfig.json` istnieją w roocie repo.
- `package.json` jest valid JSON (`jq . package.json` na hoście zwraca exit 0 — `jq` jest dostępne w większości distro).
- `tsconfig.json` jest valid JSON.
- `package.json` ma pole `packageManager` w formacie `pnpm@X.Y.Z`.
- **Nie powstał** `node_modules/` ani `pnpm-lock.yaml` (lock powstanie dopiero w tasku 005).

## Weryfikacja automatyczna

`tasks/verify/002.sh`:
- sprawdza obecność plików
- `jq empty package.json` i `jq empty tsconfig.json`
- sprawdza brak `node_modules/` i `pnpm-lock.yaml`

## Weryfikacja manualna

- [ ] `cat package.json | jq .packageManager` → `"pnpm@9.x.x"`
- [ ] IDE nie płacze na `tsconfig.json` (parser JSON zadowolony).

## Notatki dla agenta

- `type: "module"` krytyczne dla Payload v3 — nie zmieniaj na `commonjs`.
- `pnpm-lock.yaml` **nie** jest w `.gitignore` (commitujemy go) — ale na tym etapie jeszcze nie istnieje.
- `noEmit: true` jest OK: Next.js ma własny transpiler, TS używamy tylko do type-checkingu.
- W `tsconfig.json` NIE ustawiaj `outDir` ani `rootDir` — Next.js sobie tym zarządza.
