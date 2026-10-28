import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ChannelType, ChatMessage, Language } from '../../types';
import { BARBERSHOP_INFO } from '../../data/mockData';
import { getAvailableSlots } from '../../utils/bookingLogic';
import { 
  Send, 
  Sparkles, 
  Check, 
  CheckCheck, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Scissors, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  Globe
} from 'lucide-react';

interface BookingDraft {
  serviceId?: string;
  masterId?: string;
  date?: string;
  timeSlot?: string;
}

export const MessengerSimulator: React.FC = () => {
  const { 
    activeChannel, 
    setActiveChannel, 
    masters, 
    services, 
    appointments, 
    bookAppointment, 
    cancelApp,
    clientPhone,
    clientName,
    setActiveTab,
    currentLang,
    setLanguage,
    t
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const [draft, setDraft] = useState<BookingDraft>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  const getInitialMessages = (channel: ChannelType, lang: Language): ChatMessage[] => {
    const shop = BARBERSHOP_INFO.name;
    const name = clientName.split(' ')[0];
    return [
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'bot',
        text: t.botWelcome(name, shop, channel),
        timestamp: '14:00',
        channel,
        options: [
          t.btnOpenWebApp,
          t.btnBookInChat,
          t.btnMyBookings,
          t.btnPriceList,
          t.btnBarbers,
          t.btnContacts,
          t.btnSwitchLang,
        ],
      },
    ];
  };

  const [messages, setMessages] = useState<Record<ChannelType, ChatMessage[]>>({
    telegram: getInitialMessages('telegram', currentLang),
    whatsapp: getInitialMessages('whatsapp', currentLang),
    instagram: getInitialMessages('instagram', currentLang),
    facebook: getInitialMessages('facebook', currentLang),
  });

  // When language changes, update initial messages if only welcome is present
  useEffect(() => {
    setMessages(prev => ({
      ...prev,
      [activeChannel]: getInitialMessages(activeChannel, currentLang),
    }));
  }, [currentLang]);

  const currentMessages = messages[activeChannel] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping, activeChannel]);

  const addBotMessage = (text: string, options?: string[], actionType?: ChatMessage['actionType'], appointmentData?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString(currentLang === 'pl' ? 'pl-PL' : 'uk-UA', { hour: '2-digit', minute: '2-digit' });
      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        sender: 'bot',
        text,
        timestamp: now,
        channel: activeChannel,
        options,
        actionType,
        appointmentData,
      };

      setMessages(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], newMsg],
      }));
      setIsTyping(false);
    }, 450);
  };

  const addUserMessage = (text: string) => {
    const now = new Date().toLocaleTimeString(currentLang === 'pl' ? 'pl-PL' : 'uk-UA', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}_${Math.random()}`,
      sender: 'user',
      text,
      timestamp: now,
      channel: activeChannel,
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], userMsg],
    }));
  };

  const handleOptionClick = (option: string) => {
    addUserMessage(option);

    // Switch Language in Chat
    if (option === t.btnSwitchLang || option.includes('Zmień język') || option.includes('Сменить') || option.includes('Змінити')) {
      addBotMessage(
        'Wybierz język interfejsu / Оберіть мову / Выберите язык:',
        ['🇵🇱 Polski', '🇺🇦 Українська', '🇷🇺 Русский', t.btnMainMenu],
        'switch_lang'
      );
      return;
    }

    if (option === '🇵🇱 Polski') {
      setLanguage('pl');
      addBotMessage('Ustawiono język polski 🇵🇱. W czym mogę pomóc?', [
        '⚡ Zarezerwuj przez WebApp',
        '✂️ Zarezerwuj w czacie',
        '📅 Moje rezerwacje',
        '💈 Usługi i cennik',
        '⬅️ Menu główne',
      ]);
      return;
    }

    if (option === '🇺🇦 Українська') {
      setLanguage('uk');
      addBotMessage('Встановлено українську мову 🇺🇦. Чим можу допомогти?', [
        '⚡ Записатись через WebApp',
        '✂️ Записатись у чаті',
        '📅 Мої записи',
        '💈 Послуги та ціни',
        '⬅️ Головне меню',
      ]);
      return;
    }

    if (option === '🇷🇺 Русский') {
      setLanguage('ru');
      addBotMessage('Установлен русский язык 🇷🇺. Чем могу помочь?', [
        '⚡ Записаться через WebApp',
        '✂️ Записаться в чате',
        '📅 Мои записи',
        '💈 Услуги и цены',
        '⬅️ Главное меню',
      ]);
      return;
    }

    // Launch WebApp
    if (option === t.btnOpenWebApp) {
      addBotMessage(
        currentLang === 'pl'
          ? 'Otwieram interaktywną aplikację WebApp do rezerwacji...'
          : currentLang === 'uk'
          ? 'Відкриваємо інтерактивний додаток онлайн-запису WebApp...'
          : 'Открываем интерактивное приложение онлайн-записи WebApp...',
        undefined,
        'open_webapp'
      );
      setTimeout(() => {
        setActiveTab('client');
      }, 700);
      return;
    }

    // In-chat booking start
    if (option === t.btnBookInChat) {
      setDraft({});
      const serviceOptions = services.slice(0, 4).map(s => `✓ ${s.name[currentLang] || s.name.pl} (${s.price} ${t.currency})`);
      addBotMessage(
        t.botChooseService,
        [...serviceOptions, t.btnMainMenu],
        'select_service'
      );
      return;
    }

    // Selected service
    if (option.startsWith('✓ ')) {
      const cleanName = option.replace('✓ ', '').split(' (')[0];
      const selected = services.find(s => (s.name[currentLang] || s.name.pl) === cleanName) || services[0];
      setDraft(prev => ({ ...prev, serviceId: selected.id }));

      const masterOptions = masters.map(m => `👤 ${m.name} (${m.role[currentLang] || m.role.pl})`);
      addBotMessage(
        t.botChooseBarber(selected.name[currentLang] || selected.name.pl, selected.price, selected.durationMinutes),
        [...masterOptions, t.btnMainMenu],
        'select_master'
      );
      return;
    }

    // Selected master
    if (option.startsWith('👤 ')) {
      const mName = option.replace('👤 ', '').split(' (')[0];
      const chosenMaster = masters.find(m => m.name === mName) || masters[0];
      setDraft(prev => ({ ...prev, masterId: chosenMaster.id }));

      addBotMessage(
        t.botChooseDate(chosenMaster.name, chosenMaster.nickname, chosenMaster.rating),
        [
          `📅 ${todayStr}`,
          `📅 ${tomorrowStr}`,
          `📅 ${dayAfterStr}`,
          t.btnMainMenu,
        ],
        'select_date'
      );
      return;
    }

    // Selected date
    if (option.startsWith('📅 ')) {
      let selectedDate = todayStr;
      if (option.includes(tomorrowStr)) selectedDate = tomorrowStr;
      if (option.includes(dayAfterStr)) selectedDate = dayAfterStr;

      setDraft(prev => ({ ...prev, date: selectedDate }));

      const currentMasterId = draft.masterId || masters[0].id;
      const slots = getAvailableSlots(currentMasterId, selectedDate, appointments).slice(0, 8);

      if (slots.length === 0) {
        addBotMessage(
          t.botNoSlots(selectedDate),
          [`📅 ${tomorrowStr}`, `📅 ${dayAfterStr}`, t.btnMainMenu]
        );
        return;
      }

      const slotOptions = slots.map(s => `⏰ ${s}`);
      addBotMessage(
        t.botChooseTime(selectedDate),
        [...slotOptions, t.btnMainMenu],
        'select_time'
      );
      return;
    }

    // Selected time
    if (option.startsWith('⏰ ')) {
      const selectedSlot = option.replace('⏰ ', '').trim();
      const currentService = services.find(s => s.id === draft.serviceId) || services[0];
      const currentMaster = masters.find(m => m.id === draft.masterId) || masters[0];
      const targetDate = draft.date || todayStr;

      const result = bookAppointment({
        clientName,
        clientPhone,
        clientHandle: activeChannel === 'telegram' ? '@jan_zielinski' : undefined,
        channel: activeChannel,
        language: currentLang,
        masterId: currentMaster.id,
        serviceId: currentService.id,
        date: targetDate,
        timeSlot: selectedSlot,
        price: currentService.price,
      });

      if (!result.success || !result.appointment) {
        addBotMessage(`Błąd: ${result.error || 'Termin zajęty'}`, [t.btnBookInChat, t.btnMainMenu]);
        return;
      }

      const app = result.appointment;
      const serviceName = currentService.name[currentLang] || currentService.name.pl;
      const address = BARBERSHOP_INFO.address[currentLang] || BARBERSHOP_INFO.address.pl;

      addBotMessage(
        t.botBookingSuccess(
          app.bookingCode,
          serviceName,
          currentService.price,
          `${currentMaster.name} (${currentMaster.nickname})`,
          app.date,
          app.timeSlot,
          address
        ),
        [
          t.btnReschedule(app.bookingCode),
          t.btnCancel(app.bookingCode),
          t.btnMyBookings,
          t.btnMainMenu,
        ]
      );
      setDraft({});
      return;
    }

    // My Bookings
    if (option === t.btnMyBookings) {
      const myApps = appointments.filter(
        a => (a.clientPhone === clientPhone || a.clientName === clientName) && a.status !== 'cancelled'
      );

      if (myApps.length === 0) {
        addBotMessage(t.botNoActiveVisits, [t.btnBookInChat, t.btnOpenWebApp, t.btnMainMenu]);
        return;
      }

      let text = t.botActiveVisitsHeader(myApps.length);
      myApps.forEach((a, idx) => {
        const m = masters.find(x => x.id === a.masterId);
        const s = services.find(x => x.id === a.serviceId);
        const sName = s?.name[currentLang] || s?.name.pl;
        const statusName = a.status === 'confirmed' ? t.statusConfirmed : t.statusRescheduled;
        text += `${idx + 1}. **${sName}**\n` +
          `   • Barber: ${m?.name}\n` +
          `   • Data: **${a.date} o ${a.timeSlot}**\n` +
          `   • Status: ${statusName}\n` +
          `   • Kod: \`${a.bookingCode}\`\n\n`;
      });

      const actions = myApps.flatMap(a => [
        t.btnReschedule(a.bookingCode),
        t.btnCancel(a.bookingCode),
      ]);

      addBotMessage(text, [...actions.slice(0, 4), t.btnMainMenu]);
      return;
    }

    // Cancel in chat
    if (option.includes('Odwołaj') || option.includes('Скасувати') || option.includes('Отменить')) {
      const code = option.match(/BRB-\d+/)?.[0];
      const target = appointments.find(a => a.bookingCode === code);
      if (!target) {
        addBotMessage('Wizyta nie znaleziona.', [t.btnMainMenu]);
        return;
      }

      cancelApp(target.id);
      addBotMessage(t.botCancelledSuccess(code || ''), [t.btnBookInChat, t.btnMainMenu]);
      return;
    }

    // Reschedule in chat
    if (option.includes('Przełóż') || option.includes('Перенести')) {
      const code = option.match(/BRB-\d+/)?.[0];
      const target = appointments.find(a => a.bookingCode === code);
      if (!target) {
        addBotMessage('Wizyta nie znaleziona.', [t.btnMainMenu]);
        return;
      }

      setDraft({ masterId: target.masterId, serviceId: target.serviceId });
      addBotMessage(
        `${t.modalRescheduleTitle(code || '')}:\nWybierz nowy dzień:`,
        [
          `📅 ${todayStr}`,
          `📅 ${tomorrowStr}`,
          `📅 ${dayAfterStr}`,
          t.btnMainMenu,
        ]
      );
      return;
    }

    // Price list
    if (option === t.btnPriceList) {
      let text = `💈 **${BARBERSHOP_INFO.name} — ${t.btnPriceList}:**\n\n`;
      services.forEach(s => {
        const sName = s.name[currentLang] || s.name.pl;
        const sDesc = s.description[currentLang] || s.description.pl;
        text += `• **${sName}** — ${s.price} ${t.currency} (${s.durationMinutes} min)\n_${sDesc}_\n\n`;
      });
      addBotMessage(text, [t.btnBookInChat, t.btnOpenWebApp, t.btnMainMenu]);
      return;
    }

    // Barbers list
    if (option === t.btnBarbers) {
      let text = `⭐️ **${BARBERSHOP_INFO.name} — ${t.btnBarbers}:**\n\n`;
      masters.forEach(m => {
        const role = m.role[currentLang] || m.role.pl;
        const specs = (m.specialties[currentLang] || m.specialties.pl).join(', ');
        text += `• **${m.name}** (${m.nickname}) — ${role}\n  Ocena: ⭐ ${m.rating} (${m.reviewsCount})\n  ${t.experienceYears(m.experienceYears)}. Specjalizacja: ${specs}\n\n`;
      });
      addBotMessage(text, [t.btnBookInChat, t.btnOpenWebApp, t.btnMainMenu]);
      return;
    }

    // Contacts
    if (option === t.btnContacts) {
      const addr = BARBERSHOP_INFO.address[currentLang] || BARBERSHOP_INFO.address.pl;
      const hours = BARBERSHOP_INFO.workHours[currentLang] || BARBERSHOP_INFO.workHours.pl;
      addBotMessage(
        `📍 **${t.btnContacts}:**\n\n` +
        `• **Adres**: ${addr}\n` +
        `• **Telefon**: ${BARBERSHOP_INFO.phone}\n` +
        `• **Godziny otwarcia**: ${hours}\n` +
        `• **Telegram Bot**: ${BARBERSHOP_INFO.telegramBot}\n` +
        `• **Instagram**: ${BARBERSHOP_INFO.instagram}\n` +
        `• **WhatsApp**: ${BARBERSHOP_INFO.whatsapp}\n\n` +
        `☕ W barbershopie czeka na Ciebie świeżo mielona kawa, bar z napojami oraz strefa relaksu z PlayStation 5!`,
        [t.btnBookInChat, t.btnMainMenu]
      );
      return;
    }

    // Default Main Menu
    addBotMessage(
      currentLang === 'pl'
        ? 'W czym mogę pomóc? Wybierz opcję z poniższego menu:'
        : currentLang === 'uk'
        ? 'Чим можу допомогти? Оберіть дію з меню нижче:'
        : 'Чем могу помочь? Выберите действие из меню ниже:',
      [
        t.btnOpenWebApp,
        t.btnBookInChat,
        t.btnMyBookings,
        t.btnPriceList,
        t.btnBarbers,
        t.btnContacts,
        t.btnSwitchLang,
      ]
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const text = inputVal.trim();
    setInputVal('');
    addUserMessage(text);

    const lower = text.toLowerCase();
    if (lower.includes('język') || lower.includes('mowa') || lower.includes('язык') || lower.includes('lang')) {
      handleOptionClick(t.btnSwitchLang);
    } else if (lower.includes('strzyż') || lower.includes('zapis') || lower.includes('rezerw') || lower.includes('постриг') || lower.includes('стриж')) {
      handleOptionClick(t.btnBookInChat);
    } else if (lower.includes('moje') || lower.includes('wizyt') || lower.includes('мої') || lower.includes('мои')) {
      handleOptionClick(t.btnMyBookings);
    } else if (lower.includes('odwoł') || lower.includes('anuluj') || lower.includes('скасув') || lower.includes('отмен')) {
      handleOptionClick(t.btnMyBookings);
    } else if (lower.includes('cen') || lower.includes('cennik') || lower.includes('цін') || lower.includes('прайс')) {
      handleOptionClick(t.btnPriceList);
    } else if (lower.includes('barber') || lower.includes('fryzjer') || lower.includes('майстер') || lower.includes('мастер')) {
      handleOptionClick(t.btnBarbers);
    } else if (lower.includes('gdzie') || lower.includes('adres') || lower.includes('telefon') || lower.includes('контакт')) {
      handleOptionClick(t.btnContacts);
    } else {
      addBotMessage(
        currentLang === 'pl'
          ? 'Przyjąłem zapytanie! Możesz wybrać szybką akcję z menu poniżej:'
          : currentLang === 'uk'
          ? 'Запит прийнято! Скористайтеся кнопками швидких дій нижче:'
          : 'Запрос принят! Воспользуйтесь кнопками быстрых действий ниже:',
        [t.btnOpenWebApp, t.btnBookInChat, t.btnMyBookings, t.btnMainMenu]
      );
    }
  };

  const channelThemes = {
    telegram: {
      name: 'Telegram Bot',
      badge: 'Mini App Ready',
      headerBg: 'bg-[#17212b]',
      phoneBg: 'bg-[#0e1621]',
      bubbleBot: 'bg-[#182533] text-neutral-100 border border-[#232e3c]',
      bubbleUser: 'bg-[#2b5278] text-white',
      accent: 'text-sky-400',
      tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    },
    whatsapp: {
      name: 'WhatsApp Business',
      badge: 'Verified Business',
      headerBg: 'bg-[#075e54]',
      phoneBg: 'bg-[#0b141a]',
      bubbleBot: 'bg-[#202c33] text-neutral-100 border border-[#2a3942]',
      bubbleUser: 'bg-[#005c4b] text-white',
      accent: 'text-emerald-400',
      tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    instagram: {
      name: 'Instagram Direct',
      badge: 'Direct CRM Bot',
      headerBg: 'bg-[#1a1a1a]',
      phoneBg: 'bg-[#000000]',
      bubbleBot: 'bg-[#262626] text-neutral-100 border border-[#363636]',
      bubbleUser: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      accent: 'text-pink-400',
      tagColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    },
    facebook: {
      name: 'Facebook Messenger',
      badge: 'Meta Graph API',
      headerBg: 'bg-[#0084ff]',
      phoneBg: 'bg-[#18191a]',
      bubbleBot: 'bg-[#242526] text-neutral-100 border border-[#3a3b3c]',
      bubbleUser: 'bg-[#0084ff] text-white',
      accent: 'text-blue-400',
      tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
  };

  const theme = channelThemes[activeChannel];

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      {/* Channel Switcher Header Bar */}
      <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-neutral-100">
                {currentLang === 'pl'
                  ? 'Omnichannel Bot: Telegram, WhatsApp, Instagram & Facebook'
                  : currentLang === 'uk'
                  ? 'Омніканальний бот для 4 платформ'
                  : 'Омниканальный бот для 4 платформ'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              {currentLang === 'pl'
                ? 'Główny język: Polski 🇵🇱 (z automatyczną detekcją i przełącznikiem na UK 🇺🇦 / RU 🇷🇺)'
                : currentLang === 'uk'
                ? 'Основна мова: Польська 🇵🇱 (з автовизначенням та перемикачем на UK 🇺🇦 / RU 🇷🇺)'
                : 'Основной язык: Польский 🇵🇱 (с автоопределением и переключателем на UK 🇺🇦 / RU 🇷🇺)'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {(['telegram', 'whatsapp', 'instagram', 'facebook'] as const).map(ch => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  activeChannel === ch
                    ? `${channelThemes[ch].tagColor} bg-neutral-800 shadow-md scale-105`
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                <span className="capitalize">{ch}</span>
                {ch === 'telegram' && <span className="text-[10px] bg-sky-500/30 px-1 rounded">WebApp</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container: Mobile Frame + Quick Info Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Mobile Device Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[420px] rounded-[38px] border-4 border-neutral-700 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col h-[740px] relative">
            
            {/* Phone Notch */}
            <div className="bg-neutral-900 pt-2 pb-1 px-6 flex items-center justify-between text-[11px] text-neutral-400 select-none border-b border-neutral-800/40">
              <span>09:41</span>
              <div className="w-20 h-4 bg-neutral-950 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Messenger Header */}
            <div className={`${theme.headerBg} p-3.5 flex items-center justify-between text-white shadow-md transition-colors`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-sm shadow">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight text-white">
                      {BARBERSHOP_INFO.name} Bot
                    </h3>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                  </div>
                  <p className="text-[11px] opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {t.botOnline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages(prev => ({ ...prev, [activeChannel]: getInitialMessages(activeChannel, currentLang) }))}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
                  title="Reset dialog"
                  aria-label="Сброс"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Telegram WebApp Banner if Telegram */}
            {activeChannel === 'telegram' && (
              <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-sky-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Telegram Mini App v2.5</span>
                </div>
                <button
                  onClick={() => setActiveTab('client')}
                  className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold flex items-center gap-1"
                >
                  <span>{t.tabBooking}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Chat Messages Flow */}
            <div className={`flex-1 ${theme.phoneBg} p-3.5 overflow-y-auto space-y-3 font-sans text-sm`}>
              <div className="text-center my-1">
                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900/80 text-neutral-400 border border-neutral-800">
                  {currentLang === 'pl' ? 'Dzisiaj' : currentLang === 'uk' ? 'Сьогодні' : 'Сегодня'}
                </span>
              </div>

              {currentMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl p-3 text-xs sm:text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.sender === 'user' ? theme.bubbleUser : theme.bubbleBot
                    }`}
                  >
                    {msg.text}

                    {msg.actionType === 'open_webapp' && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-700/50">
                        <button
                          onClick={() => setActiveTab('client')}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center justify-center gap-2 shadow"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>{t.btnOpenWebApp}</span>
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] opacity-60 text-right mt-1 flex items-center justify-end gap-1">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>

                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(opt)}
                          className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700/80 hover:border-amber-500/50 transition-all flex items-center gap-1 active:scale-95 shadow-sm text-left"
                        >
                          <span>{opt}</span>
                          <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-2 rounded-2xl w-fit text-xs text-neutral-400 border border-neutral-700/60">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>{t.botTyping}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder={t.inputPlaceholder}
                className="flex-1 bg-neutral-950 text-neutral-100 placeholder-neutral-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2.5 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-transform active:scale-95 shadow-md"
                aria-label="Wyślij"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

        {/* Side Panel: Language & Bot Integration Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* Language Switcher Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-neutral-100 text-sm mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              {currentLang === 'pl' ? 'Wielojęzyczność i automatyczna detekcja' : currentLang === 'uk' ? 'Багатомовність та автовизначення' : 'Многоязычность и автоопределение'}
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              {currentLang === 'pl'
                ? 'Główny język systemu to Polski (PL). Język klienta jest wykrywany automatycznie z przeglądarki lub Telegrama (pl, uk, ru), z możliwością natychmiastowego ręcznego przełączenia.'
                : currentLang === 'uk'
                ? 'Основна мова системи — Польська (PL). Мова користувача автоматично підлаштовується з Telegram або браузера з можливістю ручної зміни.'
                : 'Основной язык системы — Польский (PL). Язык пользователя автоматически подстраивается из браузера/Telegram с возможностью ручного переключения.'}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'pl' as const, label: '🇵🇱 Polski (Domyślny)' },
                { code: 'uk' as const, label: '🇺🇦 Українська' },
                { code: 'ru' as const, label: '🇷🇺 Русский' },
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                    currentLang === item.code
                      ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md font-black'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-amber-500/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-400">Aktywny klient:</span>
              <span className="text-amber-400 font-semibold">{clientName} ({clientPhone})</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-neutral-200 text-sm mb-3">
              {currentLang === 'pl' ? 'Szybkie scenariusze testowe' : currentLang === 'uk' ? 'Швидкі сценарії тестування' : 'Быстрые сценарии тестирования'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleOptionClick(t.btnBookInChat)}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-left text-neutral-200 hover:text-amber-400 transition-colors"
              >
                {t.btnBookInChat}
              </button>
              <button
                onClick={() => handleOptionClick(t.btnMyBookings)}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-left text-neutral-200 hover:text-amber-400 transition-colors"
              >
                {t.btnMyBookings}
              </button>
              <button
                onClick={() => handleOptionClick(t.btnPriceList)}
                className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 text-left text-neutral-200 hover:text-amber-400 transition-colors"
              >
                {t.btnPriceList}
              </button>
              <button
                onClick={() => setActiveTab('client')}
                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left text-amber-300 hover:bg-amber-500/20 transition-colors font-semibold"
              >
                {t.btnOpenWebApp}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
