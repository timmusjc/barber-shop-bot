# 🚀 Instrukcja instalacji i wdrożenia BarberBot Pro na serwerze Ubuntu (20.04 / 22.04 / 24.04 LTS)

Ten przewodnik zawiera dwie metody uruchomienia bota i systemu CRM:
1. **Metoda 1 (Zalecana): Docker & Docker Compose** — izolowane środowisko, automatyczny restart, zerowa zależność od wersji Node.js na serwerze.
2. **Metoda 2: Bezpośrednio na hoście przez Node.js 20 i PM2**.

Obie metody zawierają konfigurację darmowego certyfikatu SSL (Let's Encrypt), odwrotnego proxy Nginx oraz rejestrację webhooków dla **Telegram** i **Facebook / Instagram**.

---

## 1. Wymagania wstępne
- Serwer VPS z systemem **Ubuntu 20.04, 22.04 lub 24.04 LTS** (Hetzner, DigitalOcean, OVH, AWS, etc.)
- Minimum **1 GB RAM** (zalecane 2 GB RAM) oraz 1 vCPU
- Domena internetowa skierowana rekordem DNS **A** na publiczny adres IP Twojego serwera (np. `twoja-domena.pl` lub `bot.twoja-domena.pl`) — *SSL HTTPS jest bezwzględnie wymagany przez Telegram i Meta dla webhooków*.

Połącz się ze swoim serwerem przez SSH:
```bash
ssh root@twoj_adres_ip
```

---

## 🐳 METODA 1: Uruchomienie w kontenerze Docker (Zalecana)

### Krok 1.1: Instalacja Docker i Docker Compose na Ubuntu

Zaktualizuj pakiety i zainstaluj oficjalny silnik Docker oraz wtyczkę Docker Compose:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx docker.io docker-compose-v2

# Włącz autostart Dockera wraz z systemem:
sudo systemctl enable --now docker

# Opcjonalnie: dodaj bieżącego użytkownika do grupy docker (aby nie pisać sudo):
sudo usermod -aG docker $USER
```

Sprawdź wersje:
```bash
docker --version
docker compose version
```

---

### Krok 1.2: Przygotowanie katalogu aplikacji i konfiguracja zmiennych `.env`

Utwórz katalog dla aplikacji i przejdź do niego:
```bash
sudo mkdir -p /var/www/barber-bot
sudo chown -R $USER:$USER /var/www/barber-bot
cd /var/www/barber-bot
```

Wgraj pliki projektu (np. przez Git `git clone <URL> .` lub SCP/SFTP).

Utwórz i edytuj plik produkcyjny `.env`:
```bash
nano .env
```

Wklej konfigurację z Twoimi danymi i kluczami:
```ini
# Środowisko i port
PORT=3000
NODE_ENV=production

# Publiczny adres Twojej domeny (z protokołem https)
APP_URL=https://twoja-domena.pl

# --- TELEGRAM BOT ---
# Token uzyskany u @BotFather w Telegramie
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567
TELEGRAM_WEBHOOK_URL=https://twoja-domena.pl/api/webhook/telegram

# --- FACEBOOK MESSENGER & INSTAGRAM ---
# Dane z panelu Meta for Developers (developers.facebook.com)
FACEBOOK_PAGE_ACCESS_TOKEN=EAAGm0PX4ZCpsBA...
FACEBOOK_VERIFY_TOKEN=twoj_unikalny_tajny_token_weryfikacji
FACEBOOK_APP_SECRET=a1b2c3d4e5f6...
```
Zapisz plik (`Ctrl + O`, `Enter`, potem `Ctrl + X`).

---

### Krok 1.3: Uruchomienie kontenera przez Docker Compose

W katalogu `/var/www/barber-bot` wykonaj polecenie:
```bash
docker compose up -d --build
```

Co robi to polecenie:
- Zbuduje zoptymalizowany, lekki obraz produkcyjny bazujący na `node:20-alpine` (multi-stage build).
- Przeprowadzi kompilację TypeScript i bundle Vite.
- Uruchomi kontener o nazwie `barber-bot` w tle (`-d`).
- Ustawi politykę restartu `unless-stopped` (kontener wstaje automatycznie po restarcie VPS lub awarii).

Sprawdź status i logi:
```bash
# Sprawdzenie czy kontener działa i przechodzi healthcheck:
docker compose ps

# Podgląd logów bota na żywo:
docker compose logs -f barber-bot
```

---

### Krok 1.4: Zarządzanie kontenerem w codziennej pracy

- **Podgląd logów w czasie rzeczywistym:**
  ```bash
  docker compose logs -f
  ```
- **Restart bota (np. po zmianie kluczy w pliku `.env`):**
  ```bash
  docker compose restart
  ```
- **Zatrzymanie kontenera:**
  ```bash
  docker compose down
  ```
- **Aktualizacja kodu (np. po pobraniu nowej wersji z Git):**
  ```bash
  git pull
  docker compose up -d --build
  ```

---

## ⚙️ METODA 2: Uruchomienie bezpośrednio na hoście (Node.js 20 + PM2)

Jeśli wolisz uruchomić aplikację tradycyjnie bez Dockera:

```bash
# 1. Instalacja Node.js 20 LTS:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 tsx

# 2. Instalacja zależności i build w katalogu /var/www/barber-bot:
cd /var/www/barber-bot
npm install
npm run build

# 3. Uruchomienie przez PM2:
pm2 start server.ts --name "barber-bot" --interpreter tsx -- --port 3000
pm2 save
pm2 startup
```

---

## 🌐 2. Konfiguracja SSL i Odwrotnego Proxy (Nginx)

### Wariant A: Masz już Nginx Proxy Manager (NPM) w Dockerze ⭐ (NAJPROSTSZA ŚCIEŻKA!)
Jeśli masz już uruchomiony Nginx Proxy Manager (NPM):
- ❌ **Certbot NIE jest potrzebny na serwerze!** NPM ma wbudowany Certbot i sam generuje oraz odnawia certyfikaty Let's Encrypt w tle.
- ❌ **Node.js i PM2 NIE są potrzebne na hoście!** Aplikacja i Node.js działają wewnątrz kontenera Docker `barber-bot`.
- Jedyne co musisz zrobić, to uruchomić bota: `docker compose up -d --build` i skonfigurować Proxy Host w panelu NPM:

**Konfiguracja w panelu NPM (port 81):**
1. Otwórz panel NPM w przeglądarce -> zakładka **Proxy Hosts** -> **Add Proxy Host**.
2. **Details**:
   - **Domain Names**: `twoja-domena.pl` (i opcjonalnie `www.twoja-domena.pl`)
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `172.17.0.1` (domyślny adres IP bramy Docker na hoście) lub lokalny/zewnętrzny IP serwera
   - **Forward Port**: `3000`
   - Zaznacz: `Block Common Exploits` oraz `Websockets Support`
3. **SSL**:
   - **SSL Certificate**: Wybierz `Request a new SSL Certificate`
   - Zaznacz: `Force SSL`, `HTTP/2 Support`
   - Wpisz swój email i zaznacz `I Agree to the Let's Encrypt Terms of Service`
4. Kliknij **Save**. Gotowe! Twoja domena ma automatyczny SSL HTTPS i przekazuje ruch do bota.

---

### Wariant B: Klasyczny Nginx i Certbot instalowane w systemie Ubuntu
Jeśli nie korzystasz z NPM, skonfiguruj natywnego Nginxa na serwerze:

Utwórz konfigurację Nginx dla swojej domeny:
```bash
sudo nano /etc/nginx/sites-available/barber-bot
```

Wklej poniższą zawartość (zamień `twoja-domena.pl` na swoją właściwą domenę):
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

Włącz konfigurację i przeładuj Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/barber-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Uzyskaj bezpłatny certyfikat SSL od Let's Encrypt (z automatycznym odnawianiem):
```bash
sudo certbot --nginx -d twoja-domena.pl -d www.twoja-domena.pl
```
Wybierz automatyczne przekierowanie HTTP na HTTPS (opcja 2).

---

## 🔗 3. Połączenie Webhooków z Telegramem i Facebookiem

### A. Rejestracja Webhooka Telegram
Wykonaj jedno polecenie cURL z poziomu serwera lub dowolnej konsoli:
```bash
curl -F "url=https://twoja-domena.pl/api/webhook/telegram" https://api.telegram.org/bot<TWÓJ_TELEGRAM_BOT_TOKEN>/setWebhook
```
*Odpowiedź powinna zawierać:*
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

Aby sprawdzić stan webhooka Telegram:
```bash
curl https://api.telegram.org/bot<TWÓJ_TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

### B. Konfiguracja Facebook Messenger & Instagram Direct
1. Wejdź na [Meta for Developers](https://developers.facebook.com/) i przejdź do swojej aplikacji.
2. Dodaj produkt **Messenger** oraz **Instagram Graph API**.
3. W sekcji **Webhooks**:
   - **Callback URL**: `https://twoja-domena.pl/api/webhook/facebook`
   - **Verify Token**: wpisz dokładnie tę samą wartość, którą ustawiłeś w pliku `.env` jako `FACEBOOK_VERIFY_TOKEN`.
   - Kliknij **Weryfikuj i zapisz** (Nasz serwer automatycznie zweryfikuje `hub.challenge`).
4. W subskrypcjach pól strony zaznacz:
   - `messages`
   - `messaging_postbacks`
   - `message_deliveries`

---

## 🩺 4. Weryfikacja działania i testy

Przetestuj poprawność działania bezpośrednio przez cURL:
```bash
# Test punktu kontrolnego zdrowia serwera (Health Check)
curl -i https://twoja-domena.pl/api/health

# Wynik powinien zwrócić HTTP 200 OK:
# {"status":"ok","timestamp":"...","uptime":12.4,"port":3000}
```

Gratulacje! Twój BarberBot Pro działa teraz stabilnie w kontenerze Docker, przetwarza wiadomości ze wszystkich kanałów i zarządza rezerwacjami w czasie rzeczywistym.
