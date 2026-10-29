import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support JSON & urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory log of webhook events for debug & admin monitoring
const webhookLogs: Array<{ id: string; channel: string; timestamp: string; payload: any }> = [];

// ==========================================
// 1. TELEGRAM WEBHOOK ENDPOINTS
// ==========================================

// User language preference storage per chat
const chatLanguages = new Map<number, 'pl' | 'uk' | 'ru'>();

/**
 * Detect user language from Telegram language_code
 */
function resolveUserLang(chatId: number, langCode?: string): 'pl' | 'uk' | 'ru' {
  if (chatLanguages.has(chatId)) {
    return chatLanguages.get(chatId)!;
  }
  if (langCode) {
    const code = langCode.toLowerCase();
    if (code.startsWith('pl')) return 'pl';
    if (code.startsWith('uk') || code.startsWith('ua')) return 'uk';
    if (code.startsWith('ru') || code.startsWith('be')) return 'ru';
  }
  return 'pl';
}

/**
 * Send Telegram message helper
 */
async function sendTgMessage(
  token: string,
  chatId: number,
  text: string,
  replyMarkup?: any
) {
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[sendTgMessage Error]', err);
    return null;
  }
}

/**
 * Answer Telegram Callback Query
 */
async function answerTgCallback(token: string, callbackQueryId: string, text?: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || '',
      }),
    });
  } catch (err) {
    console.error('[answerTgCallback Error]', err);
  }
}

/**
 * Build Main Menu message and keyboard based on language and public app URL
 */
function getMenuContent(lang: 'pl' | 'uk' | 'ru', userName: string, appUrl: string) {
  const isHttps = appUrl.startsWith('https://');

  if (lang === 'uk') {
    const text = `<b>Вітаємо, ${userName}!</b> 💈\n\nЛаскаво просимо до <b>BLADE & CROWN Barbershop</b>.\n📍 Варшава, вул. Маршалковська 84/2\n🕒 Щодня: 10:00 - 21:00\n📞 +48 22 890 45 77\n\nОберіть дію нижче для швидкого запису або керування візитами:`;
    
    const inline_keyboard: any[][] = [];
    if (isHttps) {
      inline_keyboard.push([{ text: '⚡ Записатися онлайн (WebApp)', web_app: { url: appUrl } }]);
    } else {
      inline_keyboard.push([{ text: '⚡ Відкрити онлайн-запис', url: appUrl }]);
    }
    inline_keyboard.push([
      { text: '💈 Послуги та ціни', callback_data: 'view_services' },
      { text: '✂️ Наші майстри', callback_data: 'view_masters' },
    ]);
    inline_keyboard.push([
      { text: '📅 Мої записи', callback_data: 'view_bookings' },
      { text: '🌐 Змінити мову (🇵🇱/🇺🇦/🇷🇺)', callback_data: 'change_lang' },
    ]);

    return { text, replyMarkup: { inline_keyboard } };
  }

  if (lang === 'ru') {
    const text = `<b>Привет, ${userName}!</b> 💈\n\nДобро пожаловать в <b>BLADE & CROWN Barbershop</b>.\n📍 Варшава, ул. Маршалковская 84/2\n🕒 Ежедневно: 10:00 - 21:00\n📞 +48 22 890 45 77\n\nВыберите действие ниже для быстрой записи или управления визитами:`;
    
    const inline_keyboard: any[][] = [];
    if (isHttps) {
      inline_keyboard.push([{ text: '⚡ Записаться онлайн (WebApp)', web_app: { url: appUrl } }]);
    } else {
      inline_keyboard.push([{ text: '⚡ Открыть онлайн-запись', url: appUrl }]);
    }
    inline_keyboard.push([
      { text: '💈 Услуги и цены', callback_data: 'view_services' },
      { text: '✂️ Наши мастера', callback_data: 'view_masters' },
    ]);
    inline_keyboard.push([
      { text: '📅 Мои записи', callback_data: 'view_bookings' },
      { text: '🌐 Сменить язык (🇵🇱/🇺🇦/🇷🇺)', callback_data: 'change_lang' },
    ]);

    return { text, replyMarkup: { inline_keyboard } };
  }

  // Polish (Default)
  const text = `<b>Cześć, ${userName}!</b> 💈\n\nWitamy w <b>BLADE & CROWN Barbershop</b>.\n📍 Warszawa, ul. Marszałkowska 84/2\n🕒 Codziennie: 10:00 - 21:00\n📞 +48 22 890 45 77\n\nWybierz opcję poniżej, aby umówić się na strzyżenie lub sprawdzić ofertę:`;
  
  const inline_keyboard: any[][] = [];
  if (isHttps) {
    inline_keyboard.push([{ text: '⚡ Zarezerwuj wizytę (WebApp)', web_app: { url: appUrl } }]);
  } else {
    inline_keyboard.push([{ text: '⚡ Zarezerwuj wizytę online', url: appUrl }]);
  }
  inline_keyboard.push([
    { text: '💈 Usługi i cennik', callback_data: 'view_services' },
    { text: '✂️ Nasi Mistrzowie', callback_data: 'view_masters' },
  ]);
  inline_keyboard.push([
    { text: '📅 Moje rezerwacje', callback_data: 'view_bookings' },
    { text: '🌐 Zmień język (🇵🇱/🇺🇦/🇷🇺)', callback_data: 'change_lang' },
  ]);

  return { text, replyMarkup: { inline_keyboard } };
}

/**
 * Telegram Webhook Handler
 * Telegram sends POST requests with Update object (message, callback_query, etc.)
 */
app.post('/api/webhook/telegram', async (req, res) => {
  try {
    const update = req.body;
    const logItem = {
      id: `tg_${Date.now()}`,
      channel: 'telegram',
      timestamp: new Date().toLocaleTimeString(),
      payload: update,
    };
    webhookLogs.unshift(logItem);
    if (webhookLogs.length > 50) webhookLogs.pop();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const host = req.get('host') || 'localhost:3000';
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    const appUrl = process.env.APP_URL || `${proto}://${host}`;

    // 1. Handle incoming text message
    if (update?.message) {
      const message = update.message;
      const chatId = message.chat?.id;
      const text = (message.text || '').trim();
      const userName = message.from?.first_name || 'Gość';
      const userLangCode = message.from?.language_code;

      const currentLang = resolveUserLang(chatId, userLangCode);
      console.log(`[Telegram Webhook] Chat ${chatId} (${currentLang}): "${text}"`);

      if (botToken) {
        if (text.startsWith('/start') || text.toLowerCase() === 'start' || text.toLowerCase() === 'menu') {
          const menu = getMenuContent(currentLang, userName, appUrl);
          await sendTgMessage(botToken, chatId, menu.text, menu.replyMarkup);
        } else if (text.startsWith('/lang')) {
          const langText = currentLang === 'uk' 
            ? 'Оберіть зручну мову спілкування:' 
            : currentLang === 'ru' 
            ? 'Выберите язык общения:' 
            : 'Wybierz preferowany język obsługi:';
          await sendTgMessage(botToken, chatId, langText, {
            inline_keyboard: [
              [{ text: '🇵🇱 Polski (Domyślny)', callback_data: 'set_lang_pl' }],
              [{ text: '🇺🇦 Українська', callback_data: 'set_lang_uk' }],
              [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }],
            ],
          });
        } else {
          // Standard response / echo with menu
          const menu = getMenuContent(currentLang, userName, appUrl);
          await sendTgMessage(botToken, chatId, menu.text, menu.replyMarkup);
        }
      }
    }

    // 2. Handle callback queries (inline button clicks)
    if (update?.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message?.chat?.id;
      const cqId = cq.id;
      const action = cq.data;
      const userName = cq.from?.first_name || 'Gość';

      if (botToken && chatId) {
        await answerTgCallback(botToken, cqId);
        let currentLang = resolveUserLang(chatId, cq.from?.language_code);

        // Language switch handlers
        if (action === 'set_lang_pl') {
          chatLanguages.set(chatId, 'pl');
          currentLang = 'pl';
          const menu = getMenuContent('pl', userName, appUrl);
          await sendTgMessage(botToken, chatId, `✅ <b>Język zmieniony na Polski</b> 🇵🇱\n\n` + menu.text, menu.replyMarkup);
        } else if (action === 'set_lang_uk') {
          chatLanguages.set(chatId, 'uk');
          currentLang = 'uk';
          const menu = getMenuContent('uk', userName, appUrl);
          await sendTgMessage(botToken, chatId, `✅ <b>Мову змінено на Українську</b> 🇺🇦\n\n` + menu.text, menu.replyMarkup);
        } else if (action === 'set_lang_ru') {
          chatLanguages.set(chatId, 'ru');
          currentLang = 'ru';
          const menu = getMenuContent('ru', userName, appUrl);
          await sendTgMessage(botToken, chatId, `✅ <b>Язык изменён на Русский</b> 🇷🇺\n\n` + menu.text, menu.replyMarkup);
        } else if (action === 'change_lang') {
          const langText = currentLang === 'uk' 
            ? 'Оберіть зручну мову:' 
            : currentLang === 'ru' 
            ? 'Выберите язык:' 
            : 'Wybierz język:';
          await sendTgMessage(botToken, chatId, langText, {
            inline_keyboard: [
              [{ text: '🇵🇱 Polski', callback_data: 'set_lang_pl' }],
              [{ text: '🇺🇦 Українська', callback_data: 'set_lang_uk' }],
              [{ text: '🇷🇺 Русский', callback_data: 'set_lang_ru' }],
              [{ text: '🔙 Powrót / Назад', callback_data: 'back_to_menu' }],
            ],
          });
        } else if (action === 'view_services') {
          let sText = '';
          if (currentLang === 'uk') {
            sText = `<b>💈 Послуги та ціни BLADE & CROWN:</b>\n\n` +
              `• <b>Чоловіча стрижка (Fade / Класика)</b> — 120 zł (45 хв)\n` +
              `• <b>Моделювання та стрижка бороди</b> — 80 zł (30 хв)\n` +
              `• <b>Комплекс COMBO (Стрижка + Борода + Гарячий компрес)</b> — 170 zł (60 хв)\n` +
              `• <b>Королівське гоління небезпечною бритвою</b> — 100 zł (40 хв)\n` +
              `• <b>Камуфляж сивини бороди / волосся</b> — 90 zł (35 хв)\n` +
              `• <b>Дитяча стрижка (до 12 років)</b> — 90 zł (40 хв)\n\n` +
              `🎁 <i>Кава, віскі та преміум-догляд включені у вартість!</i>`;
          } else if (currentLang === 'ru') {
            sText = `<b>💈 Услуги и цены BLADE & CROWN:</b>\n\n` +
              `• <b>Мужская стрижка (Fade / Классика)</b> — 120 zł (45 мин)\n` +
              `• <b>Моделирование и стрижка бороды</b> — 80 zł (30 мин)\n` +
              `• <b>Комплекс COMBO (Стрижка + Борода + Горячий компресс)</b> — 170 zł (60 мин)\n` +
              `• <b>Королевское бритьё опасной бритвой</b> — 100 zł (40 мин)\n` +
              `• <b>Камуфляж седины бороды / волос</b> — 90 zł (35 мин)\n` +
              `• <b>Детская стрижка (до 12 лет)</b> — 90 zł (40 мин)\n\n` +
              `🎁 <i>Кофе, виски и премиальный уход включены в стоимость!</i>`;
          } else {
            sText = `<b>💈 Usługi i cennik BLADE & CROWN:</b>\n\n` +
              `• <b>Strzyżenie męskie (Fade / Klasyk)</b> — 120 zł (45 min)\n` +
              `• <b>Modelowanie i trymowanie brody</b> — 80 zł (30 min)\n` +
              `• <b>Pakiet COMBO (Włosy + Broda + Kompres)</b> — 170 zł (60 min)\n` +
              `• <b>Królewskie golenie brzytwą</b> — 100 zł (40 min)\n` +
              `• <b>Kamuflaż siwizny brody / włosów</b> — 90 zł (35 min)\n` +
              `• <b>Strzyżenie junior (do 12 lat)</b> — 90 zł (40 min)\n\n` +
              `🎁 <i>Kawa ziarnista, whisky i stylizacja w cenie wizyty!</i>`;
          }

          const isHttps = appUrl.startsWith('https://');
          const bookBtn = isHttps 
            ? [{ text: '⚡ Zarezerwuj wizytę teraz', web_app: { url: appUrl } }]
            : [{ text: '⚡ Zarezerwuj wizytę teraz', url: appUrl }];

          await sendTgMessage(botToken, chatId, sText, {
            inline_keyboard: [
              bookBtn,
              [{ text: '🔙 Menu główne', callback_data: 'back_to_menu' }],
            ],
          });
        } else if (action === 'view_masters') {
          let mText = '';
          if (currentLang === 'uk') {
            mText = `<b>✂️ Наші топ-барбери:</b>\n\n` +
              `👑 <b>Jakub Gromov</b> — Шеф-барбер (9 років досвіду, оцінка 4.98 ⭐)\n` +
              `Спеціалізація: бездоганний Fade, королівське гоління.\n\n` +
              `✂️ <b>David Marti</b> — Senior Barber (6 років досвіду, оцінка 4.95 ⭐)\n` +
              `Спеціалізація: моделювання бороди, авторські текстури.\n\n` +
              `⚡ <b>Marek Wójcik</b> — Fade Specialist (4 роки досвіду, оцінка 4.91 ⭐)\n` +
              `Спеціалізація: skin fade, геометрія ліній, hair tattoo.\n\n` +
              `🔥 <b>Artem Bondar</b> — Classic Barber (5 років досвіду, оцінка 4.93 ⭐)\n` +
              `Спеціалізація: британська класика, помпадур, кроп.`;
          } else if (currentLang === 'ru') {
            mText = `<b>✂️ Наши топ-барберы:</b>\n\n` +
              `👑 <b>Jakub Gromov</b> — Шеф-барбер (9 лет опыта, оценка 4.98 ⭐)\n` +
              `Специализация: безупречный Fade, королевское бритьё.\n\n` +
              `✂️ <b>David Marti</b> — Senior Barber (6 лет опыта, оценка 4.95 ⭐)\n` +
              `Специализация: моделирование бороды, авторские текстуры.\n\n` +
              `⚡ <b>Marek Wójcik</b> — Fade Specialist (4 года опыта, оценка 4.91 ⭐)\n` +
              `Специализация: skin fade, геометрия линий, hair tattoo.\n\n` +
              `🔥 <b>Artem Bondar</b> — Classic Barber (5 лет опыта, оценка 4.93 ⭐)\n` +
              `Специализация: британская классика, помпадур, кроп.`;
          } else {
            mText = `<b>✂️ Nasi Mistrzowie Fryzjerstwa:</b>\n\n` +
              `👑 <b>Jakub Gromov</b> — Chief Barber (9 lat dośw., ocena 4.98 ⭐)\n` +
              `Specjalizacja: perfekcyjny Fade, tradycyjne golenie brzytwą.\n\n` +
              `✂️ <b>David Marti</b> — Senior Barber (6 lat dośw., ocena 4.95 ⭐)\n` +
              `Specjalizacja: stylizacja brody, strzyżenia nożyczkami.\n\n` +
              `⚡ <b>Marek Wójcik</b> — Fade Specialist (4 lata dośw., ocena 4.91 ⭐)\n` +
              `Specjalizacja: modern skin fade, stylizacje geometryczne.\n\n` +
              `🔥 <b>Artem Bondar</b> — Classic Barber (5 lat dośw., ocena 4.93 ⭐)\n` +
              `Specjalizacja: klasyka dżentelmeńska, pompadour, crop.`;
          }

          const isHttps = appUrl.startsWith('https://');
          const bookBtn = isHttps 
            ? [{ text: '⚡ Wybierz mistrza w WebApp', web_app: { url: appUrl } }]
            : [{ text: '⚡ Wybierz mistrza w WebApp', url: appUrl }];

          await sendTgMessage(botToken, chatId, mText, {
            inline_keyboard: [
              bookBtn,
              [{ text: '🔙 Menu główne', callback_data: 'back_to_menu' }],
            ],
          });
        } else if (action === 'view_bookings') {
          let bText = '';
          if (currentLang === 'uk') {
            bText = `<b>📅 Керування візитами:</b>\n\n` +
              `Ви можете зручно переглядати, змінювати час або скасовувати свої візити у нашому WebApp кабінеті клієнта.\n\n` +
              `Натисніть кнопку нижче, щоб відкрити свій профіль візитів:`;
          } else if (currentLang === 'ru') {
            bText = `<b>📅 Управление визитами:</b>\n\n` +
              `Вы можете удобно просматривать, переносить время или отменять свои визиты в нашем WebApp кабинете клиента.\n\n` +
              `Нажмите кнопку ниже, чтобы открыть профиль визитов:`;
          } else {
            bText = `<b>📅 Zarządzanie rezerwacjami:</b>\n\n` +
              `Możesz w każdej chwili sprawdzić termin, przenieść godzinę lub odwołać wizytę bezpośrednio w profilu klienta WebApp.\n\n` +
              `Kliknij przycisk poniżej, aby zarządzać wizytami:`;
          }

          const isHttps = appUrl.startsWith('https://');
          const bookBtn = isHttps 
            ? [{ text: '👤 Moje wizyty w WebApp', web_app: { url: appUrl } }]
            : [{ text: '👤 Moje wizyty w WebApp', url: appUrl }];

          await sendTgMessage(botToken, chatId, bText, {
            inline_keyboard: [
              bookBtn,
              [{ text: '🔙 Menu główne', callback_data: 'back_to_menu' }],
            ],
          });
        } else if (action === 'back_to_menu') {
          const menu = getMenuContent(currentLang, userName, appUrl);
          await sendTgMessage(botToken, chatId, menu.text, menu.replyMarkup);
        }
      }
    }

    // Telegram requires 200 OK
    res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Set Telegram Webhook API proxy
 */
app.post('/api/bot/set-webhook/telegram', async (req, res) => {
  const { botToken, webhookUrl } = req.body;
  if (!botToken || !webhookUrl) {
    return res.status(400).json({ ok: false, error: 'botToken and webhookUrl are required' });
  }

  try {
    const tgUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    const response = await fetch(tgUrl);
    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * Verify Telegram Bot Token (calls getMe)
 */
app.post('/api/bot/verify/telegram', async (req, res) => {
  const { botToken } = req.body;
  if (!botToken) {
    return res.status(400).json({ ok: false, error: 'botToken is required' });
  }

  try {
    const tgUrl = `https://api.telegram.org/bot${botToken}/getMe`;
    const response = await fetch(tgUrl);
    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    // If offline or blocked, mock validation for demo
    const isValidFormat = /^\d{8,12}:[a-zA-Z0-9_-]{30,50}$/.test(botToken.trim());
    return res.json({
      ok: isValidFormat,
      result: isValidFormat ? { username: 'BladeCrown_Bot', first_name: 'Blade & Crown Bot', can_join_groups: true } : undefined,
      description: isValidFormat ? 'Format verified' : err.message,
    });
  }
});

// ==========================================
// 2. FACEBOOK & INSTAGRAM WEBHOOK ENDPOINTS
// ==========================================

/**
 * Facebook Webhook Verification (Meta Hub Challenge)
 * Meta makes a GET request to verify the token during webhook configuration.
 */
app.get('/api/webhook/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.FACEBOOK_VERIFY_TOKEN || 'blade_crown_barber_secret_token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Facebook Webhook] Hub challenge verified successfully!');
    return res.status(200).send(challenge);
  }

  console.warn('[Facebook Webhook] Verification token mismatch:', { token, expectedToken });
  return res.status(403).send('Forbidden');
});

/**
 * Facebook & Instagram Message Ingestion
 */
app.post('/api/webhook/facebook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'page' || body.object === 'instagram') {
      const logItem = {
        id: `fb_${Date.now()}`,
        channel: body.object === 'instagram' ? 'instagram' : 'facebook',
        timestamp: new Date().toLocaleTimeString(),
        payload: body,
      };
      webhookLogs.unshift(logItem);
      if (webhookLogs.length > 50) webhookLogs.pop();

      body.entry?.forEach((entry: any) => {
        const messaging = entry.messaging || entry.standby;
        messaging?.forEach((event: any) => {
          const senderId = event.sender?.id;
          const text = event.message?.text;
          console.log(`[Meta Webhook] ${body.object} message from ${senderId}: ${text}`);
        });
      });

      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.sendStatus(404);
  } catch (err: any) {
    console.error('[Facebook Webhook Error]', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Verify Facebook Token API
 */
app.post('/api/bot/verify/facebook', async (req, res) => {
  const { pageAccessToken } = req.body;
  if (!pageAccessToken) {
    return res.status(400).json({ ok: false, error: 'pageAccessToken is required' });
  }

  try {
    const fbUrl = `https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`;
    const response = await fetch(fbUrl);
    const data = await response.json();
    return res.json({ ok: !data.error, data });
  } catch (err: any) {
    const isFormatOk = pageAccessToken.length > 30;
    return res.json({
      ok: isFormatOk,
      data: isFormatOk ? { name: 'BLADE & CROWN Barber Page', id: '1092837465' } : null,
      error: err.message,
    });
  }
});

/**
 * Get recent webhook logs
 */
app.get('/api/webhook/logs', (_req, res) => {
  res.json({ ok: true, logs: webhookLogs });
});

/**
 * Healthcheck
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'BarberBot Pro Omnichannel API',
    version: '2.5.0',
    primaryLanguage: 'pl',
    supportedLanguages: ['pl', 'uk', 'ru'],
    telegramWebhookConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    facebookWebhookConfigured: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
  });
});

// ==========================================
// 3. VITE MIDDLEWARE / STATIC ASSETS
// ==========================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BarberBot Pro] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[BarberBot Pro] Primary language: Polish (pl), secondary: Ukrainian (uk), Russian (ru)`);
  });
}

startServer().catch((err) => {
  console.error('[Startup Error]', err);
  process.exit(1);
});
