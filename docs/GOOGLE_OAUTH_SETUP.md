# Konfiguracja Google OAuth — krok po kroku

Instrukcja dla operatora/właściciela projektu. Agent nie ma dostępu do Google Cloud Console — wykonaj poniższe kroki ręcznie przed uruchomieniem tasku 008.

---

## 1. Utwórz projekt w Google Cloud Console

1. Wejdź na [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. Z menu górnego (wybór projektu) kliknij **Nowy projekt**.
3. Wpisz nazwę, np. `Kalendarz Kolorowanki`, i kliknij **Utwórz**.
4. Upewnij się, że nowy projekt jest aktywny (widoczny w selektorze u góry).

---

## 2. Włącz Google Identity (People API)

1. W menu bocznym: **Interfejsy API i usługi → Biblioteka**.
2. Wyszukaj `Google Identity` i włącz **Google Identity Services API** (jeśli nie jest włączone automatycznie — zwykle nie jest wymagane dla OAuth 2.0, ale warto mieć).

---

## 3. Skonfiguruj ekran zgody OAuth

1. Przejdź do **Interfejsy API i usługi → Ekran zgody OAuth**.
2. Wybierz typ użytkownika: **Zewnętrzny** (External), kliknij **Utwórz**.
3. Wypełnij wymagane pola:
   - **Nazwa aplikacji**: `Kalendarz Kolorowanki`
   - **E-mail pomocy technicznej**: `kontakt@marcinmaruszewski.me`
   - **Dane kontaktowe dewelopera**: `kontakt@marcinmaruszewski.me`
4. Kliknij **Zapisz i kontynuuj**.
5. Na stronie **Zakresy** — pomiń (kliknij **Zapisz i kontynuuj**).
6. Na stronie **Użytkownicy testowi** — dodaj swój adres Gmail, jeśli aplikacja jest w trybie **Testing**. W trybie testowym tylko dodani użytkownicy mogą się zalogować.
7. Kliknij **Zapisz i kontynuuj**, potem **Powrót do pulpitu**.

> **Uwaga:** Status *Testing* wystarczy w dev. Przed produkcją zmień na *In production* (wymaga weryfikacji Google tylko jeśli używasz wrażliwych zakresów — a nie używamy).

---

## 4. Utwórz OAuth 2.0 Client ID

1. Przejdź do **Interfejsy API i usługi → Dane logowania**.
2. Kliknij **Utwórz dane logowania → Identyfikator klienta OAuth**.
3. Wybierz typ: **Aplikacja internetowa** (Web application).
4. Nadaj nazwę, np. `Kalendarz dev`.
5. W sekcji **Autoryzowane identyfikatory URI przekierowania** dodaj oba adresy:
   ```
   http://localhost:3000/api/auth/google/callback
   https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback
   ```
6. Kliknij **Utwórz**.

Google wyświetli **Client ID** i **Client Secret** — skopiuj oba.

---

## 5. Uzupełnij `.env`

W katalogu projektu skopiuj `.env.example` do `.env` (jeśli jeszcze nie istnieje):

```bash
cp .env.example .env
```

Następnie uzupełnij w `.env`:

```
GOOGLE_CLIENT_ID=<twój Client ID z kroku 4>
GOOGLE_CLIENT_SECRET=<twój Client Secret z kroku 4>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

W środowisku produkcyjnym (Dokploy) ustaw `GOOGLE_REDIRECT_URI` na:
```
GOOGLE_REDIRECT_URI=https://kolorowanki.marcinmaruszewski.me/api/auth/google/callback
```

---

## Ważne uwagi

- **Redirect URI musi zgadzać się co do znaku** z wartością `GOOGLE_REDIRECT_URI` w `.env`. Jakakolwiek różnica (trailing slash, http vs https) spowoduje błąd `redirect_uri_mismatch` ze strony Google.
- Nie wpisuj Client ID ani Client Secret bezpośrednio do kodu — wyłącznie przez `.env`.
- Plik `.env` jest w `.gitignore` — nie zostanie zacommitowany.
- Przed deployem na produkcję dodaj redirect URI produkcyjny do listy autoryzowanych URI w Google Console (możesz mieć kilka URI naraz).
