# 🚀 Instrukcja instalacji i wdrożenia BarberBot Pro na serwerze Ubuntu (20.04 / 22.04 / 24.04 LTS)

Ten przewodnik przeprowadzi Cię krok po kroku przez instalację, konfigurację domeny z certyfikatem SSL, uruchomienie bota 24/7 w tle oraz powiązanie kluczy API **Telegram** i **Facebook Messenger / Instagram**.

---

## 1. Wymagania systemowe
- Serwer VPS z systemem **Ubuntu 20.04, 22.04 lub 24.04 LTS**
- Minimum **1 GB RAM** (zalecane 2 GB) oraz 1 vCPU
- Domena internetowa skierowana rekordem **A** na publiczny adres IP Twojego serwera (np. `twoja-domena.pl` lub `bot.twoja-domena.pl`) — *SSL jest wymagany przez Telegram i Meta dla webhooków*.

---

## 2. Aktualizacja systemu i instalacja Node.js 20 LTS

Połącz się z serwerem przez SSH:
```bash
ssh root@twoj_adres_ip
```

Zaktualizuj pakiety i zainstaluj podstawowe narzędzia:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx
```

Zainstaluj najnowszą stabilną wersję **Node.js 20 LTS**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v # powinno pokazać v20.x.x
npm -v
```

Zainstaluj menedżer procesów **PM2**:
```bash
sudo npm install -g pm2 tsx
```

---

## 3. Klonowanie projektu i instalacja zależności

Utwórz katalog dla aplikacji i sklonuj repozytorium:
```bash
sudo mkdir -p /var/www/barber-bot
sudo chown -R $USER:$USER /var/www/barber-bot
cd /var/www/barber-bot

# Skopiuj pliki projektu do tego katalogu lub sklonuj z Git:
# git clone <URL_TWOJEGO_REPOZYTORIUM> .

npm install
```

---

## 4. Konfiguracja zmiennych środowiskowych (.env)

Utwórz plik `.env` w katalogu głównym `/var/www/barber-bot/.env`:
```bash
nano .env
```

Wklej poniższą konfigurację i uzupełnij swoje klucze:
```ini
# Port aplikacji
PORT=3000
NODE_ENV=production

# Publiczny URL Twojej domeny (HTTPS)
APP_URL=https://twoja-domena.pl

# --- TELEGRAM BOT ---
# Uzyskaj token u @BotFather w Telegramie
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567
TELEGRAM_WEBHOOK_URL=https://twoja-domena.pl/api/webhook/telegram

# --- FACEBOOK MESSENGER & INSTAGRAM ---
# Uzyskaj w Meta for Developers (developers.facebook.com)
FACEBOOK_PAGE_ACCESS_TOKEN=EAAGm0PX4ZCpsBA...
FACEBOOK_VERIFY_TOKEN=twoj_unikalny_tajny_token_weryfikacji
FACEBOOK_APP_SECRET=a1b2c3d4e5f6...
```
Zapisz plik (`Ctrl + O`, `Enter`, potem `Ctrl + X`).

---

## 5. Zbudowanie frontendu (Build)

```bash
npm run build
```

---

## 6. Uruchomienie aplikacji przez PM2 (Auto-restart 24/7)

Uruchom serwer produkcyjny:
```bash
pm2 start server.ts --name "barber-bot" --interpreter tsx -- --port 3000
```

Skonfiguruj automatyczny start PM2 po restarcie serwera:
```bash
pm2 save
pm2 startup
# Wykonaj polecenie, które wypisze PM2 na ekranie (zaczynające się od sudo env PATH=...)
```

Sprawdzenie statusu i logów:
```bash
pm2 status
pm2 logs barber-bot
```

---

## 7. Konfiguracja Nginx (Odwrotne proxy) i darmowy SSL Let's Encrypt

Utwórz konfigurację Nginx dla swojej domeny:
```bash
sudo nano /etc/nginx/sites-available/barber-bot
```

Wklej poniższą zawartość (zamień `twoja-domena.pl` na swoją domenę):
```nginx
server {
    listen 80;
    server_name twoja-domena.pl www.twoja-domena.pl;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Włącz witrynę i przetestuj konfigurację Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/barber-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Uzyskaj bezpłatny certyfikat SSL od Let's Encrypt:
```bash
sudo certbot --nginx -d twoja-domena.pl -d www.twoja-domena.pl
```
Wybierz automatyczne przekierowanie HTTP na HTTPS (opcja 2).

---

## 8. Powiązanie kluczy z Telegramem i Facebookiem

### A. Rejestracja Webhooka Telegram
Wystarczy wykonać jedno zapytanie cURL z poziomu serwera lub przeglądarki:
```bash
curl -F "url=https://twoja-domena.pl/api/webhook/telegram" https://api.telegram.org/bot<TWÓJ_TELEGRAM_BOT_TOKEN>/setWebhook
```
*Odpowiedź powinna zawierać:* `{"ok":true,"result":true,"description":"Webhook was set"}`.

### B. Konfiguracja Facebook Messenger & Instagram Direct
1. Wejdź na [developers.facebook.com](https://developers.facebook.com/) i utwórz aplikację typu **Business / Komunikacja**.
2. Dodaj produkt **Messenger** i **Instagram Graph API**.
3. W sekcji **Webhooks**:
   - **Callback URL**: `https://twoja-domena.pl/api/webhook/facebook`
   - **Verify Token**: wpisz tę samą wartość, którą ustawiłeś w pliku `.env` jako `FACEBOOK_VERIFY_TOKEN`.
   - Kliknij **Weryfikuj i zapisz**.
4. W sekcji subskrypcji pól strony zaznacz: `messages`, `messaging_postbacks`, `message_deliveries`.

---

## 9. Przydatne komendy serwisowe

- Podgląd logów bota na żywo:
  ```bash
  pm2 logs barber-bot
  ```
- Restart bota po zmianie kodu lub pliku `.env`:
  ```bash
  pm2 restart barber-bot
  ```
- Sprawdzenie działania portu lokalnego:
  ```bash
  curl http://127.0.0.1:3000/api/health
  ```
- Sprawdzenie statusu Nginx:
  ```bash
  sudo systemctl status nginx
  ```
