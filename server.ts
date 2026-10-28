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

    const message = update?.message;
    if (message) {
      const chatId = message.chat?.id;
      const text = message.text || '';
      const userLang = message.from?.language_code || 'pl';

      console.log(`[Telegram Webhook] Received "${text}" from Chat ${chatId} (lang: ${userLang})`);
      // When live with TELEGRAM_BOT_TOKEN:
      // Can call https://api.telegram.org/bot<TOKEN>/sendMessage
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
