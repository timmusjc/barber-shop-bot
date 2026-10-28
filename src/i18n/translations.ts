import { Language } from '../types';

export function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'pl';

  // 1. Saved preference in localStorage has highest priority
  try {
    const saved = localStorage.getItem('barber_app_lang');
    if (saved === 'pl' || saved === 'uk' || saved === 'ru') {
      return saved as Language;
    }
  } catch {}

  // 2. Telegram WebApp user language
  try {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.language_code) {
      const code = tgUser.language_code.toLowerCase();
      if (code.startsWith('pl')) return 'pl';
      if (code.startsWith('uk') || code.startsWith('ua')) return 'uk';
      if (code.startsWith('ru') || code.startsWith('be')) return 'ru';
    }
  } catch {}

  // 3. Browser locale detection
  try {
    const navLangs = navigator.languages || [navigator.language || ''];
    for (const lang of navLangs) {
      const code = lang.toLowerCase();
      if (code.startsWith('pl')) return 'pl';
      if (code.startsWith('uk') || code.startsWith('ua')) return 'uk';
      if (code.startsWith('ru') || code.startsWith('be')) return 'ru';
    }
  } catch {}

  // Default is Polish as primary language
  return 'pl';
}

export const TRANSLATIONS = {
  pl: {
    langName: 'Polski',
    flag: '🇵🇱',
    currency: 'zł',
    // Header
    appTagline: 'Inteligentny bot TG / WA / IG / FB & CRM dla barbershopu',
    tabBot: 'Chatbot',
    tabBooking: 'Rezerwacja / Profil',
    tabMaster: 'Mistrz',
    tabAdmin: 'Admin CRM',
    notifications: 'Powiadomienia',
    barber: 'Barber:',

    // Bot messages & flows
    botOnline: 'online • Gotowy do rezerwacji',
    botWelcome: (name: string, shopName: string, channel: string) =>
      `Witaj, ${name}! 💈\n\nTu oficjalny bot luksusowego barbershopu **${shopName}** na platformie ${channel.toUpperCase()}.\n\nZarezerwuj wizytę u mistrza fryzjerstwa w 1 minutę, sprawdź wolne terminy, zarządzaj swoimi rezerwacjami lub otwórz interaktywną aplikację WebApp.`,
    btnOpenWebApp: '⚡ Zarezerwuj przez WebApp',
    btnBookInChat: '✂️ Zarezerwuj w czacie',
    btnMyBookings: '📅 Moje rezerwacje',
    btnPriceList: '💈 Usługi i cennik',
    btnBarbers: '⭐️ Nasi barberzy',
    btnContacts: '📍 Adres i kontakt',
    btnSwitchLang: '🌐 Zmień język / Switch language',
    btnMainMenu: '⬅️ Menu główne',
    botChooseService: 'Świetnie! Jaką usługę chcesz wybrać?',
    botChooseBarber: (serviceName: string, price: number, duration: number) =>
      `Wybrano "${serviceName}" (${price} zł, ${duration} min).\n\nDo którego mistrza chcesz się umówić?`,
    botChooseDate: (barberName: string, nickname: string, rating: number) =>
      `Barber: ${barberName} (${nickname}) ⭐ ${rating}.\n\nWybierz dogodny dzień wizyty:`,
    botChooseTime: (date: string) =>
      `Wolne terminy na ${date}:\nWybierz dogodną godzinę:`,
    botNoSlots: (date: string) =>
      `Niestety na dzień ${date} brak wolnych godzin u tego mistrza. Wybierz inny termin.`,
    botBookingSuccess: (code: string, service: string, price: number, barber: string, date: string, time: string, address: string) =>
      `🎉 **Twoja wizyta została pomyślnie potwierdzona!**\n\n` +
      `• **Kod rezerwacji**: \`${code}\`\n` +
      `• **Usługa**: ${service} (${price} zł)\n` +
      `• **Barber**: ${barber}\n` +
      `• **Data i godzina**: ${date} o ${time}\n` +
      `• **Adres**: ${address}\n\n` +
      `🔔 *Mistrz otrzymał natychmiastowe powiadomienie! Wyślemy Ci również przypomnienie 24h oraz 2h przed wizytą.*`,
    btnReschedule: (code: string) => `🔄 Przełóż wizytę (${code})`,
    btnCancel: (code: string) => `❌ Odwołaj wizytę (${code})`,
    botCancelledSuccess: (code: string) =>
      `❌ Wizyta **${code}** została odwołana.\n\nTermin został zwolniony dla innych gości, a barber poinformowany. Zapraszamy w innym terminie!`,
    botNoActiveVisits: 'Nie masz obecnie aktywnych rezerwacji. Chcesz umówić się na strzyżenie?',
    botActiveVisitsHeader: (count: number) => `📋 **Twoje aktualne wizyty (${count}):**\n\n`,
    botTyping: 'Bot pisze odpowiedź...',
    inputPlaceholder: 'Napisz do bota (np. chcę strzyżenie)...',

    // Client WebApp & Booking Wizard
    webAppTitle: 'BLADE & CROWN — WebApp Serwis',
    webAppSubtitle: 'Rezerwacja online i zarządzanie wizytami klienta',
    tabNewBooking: '✂️ Nowa rezerwacja',
    tabProfile: '👤 Mój profil i wizyty',
    stepService: 'Usługa',
    stepBarber: 'Barber',
    stepDateTime: 'Data i godzina',
    stepContacts: 'Kontakt',
    step1Title: '1. Wybierz usługę barbershopu',
    step1Desc: 'Każda usługa obejmuje mycie głowy luksusowymi kosmetykami oraz drinki z baru',
    topChoice: 'Bestseller',
    durationMin: 'min',
    btnNextBarber: 'Dalej: Wybierz barbera',
    step2Title: '2. Wybierz mistrza',
    step2Desc: 'Nasi barberzy posiadają wieloletnie doświadczenie i certyfikaty międzynarodowe',
    experienceYears: (years: number) => `Staż: ${years} lat`,
    btnNextTime: 'Dalej: Wybierz godzinę',
    step3Title: '3. Wybierz datę i godzinę',
    step3Desc: 'Dostępność slotów aktualizowana w czasie rzeczywistym',
    labelDate: 'Data wizyty:',
    labelAvailableHours: (date: string) => `Wolne godziny na ${date}:`,
    btnNextContacts: 'Dalej: Dane kontaktowe',
    step4Title: '4. Potwierdzenie i dane kontaktowe',
    step4Desc: 'Wpisz imię i telefon do potwierdzenia oraz wysyłki przypomnień SMS/Messenger',
    labelName: 'Twoje imię i nazwisko *',
    labelPhone: 'Numer telefonu *',
    labelChannel: 'Kanał powiadomień i przypomnień:',
    labelNotes: 'Uwagi do wizyty (opcjonalnie)',
    notesPlaceholder: 'Np. fade od zera, kawa espresso...',
    btnFinishBooking: 'Potwierdź rezerwację',
    bookingSuccessTitle: 'Zostałeś pomyślnie zapisany!',
    bookingSuccessDesc: (channel: string) => `Wysłaliśmy potwierdzenie na Twój ${channel.toUpperCase()} oraz powiadomiliśmy mistrza.`,
    bookingCodeLabel: 'Kod rezerwacji:',
    btnGoToVisits: 'Przejdź do moich wizyt',
    btnBookAnother: 'Zarezerwuj kolejną wizytę',
    clientLoyaltyCard: 'KARTA STAŁEGO KLIENTA',
    clientDiscount: 'Zniżka klubowa: 10% • Liczba wizyt:',
    activeBookingsTitle: (count: number) => `Aktywne rezerwacje (${count})`,
    noActiveBookings: 'Nie masz zaplanowanych wizyt',
    btnRescheduleVisit: 'Przełóż wizytę',
    btnCancelVisit: 'Odwołaj',
    visitHistoryTitle: (count: number) => `Historia wizyt (${count})`,
    modalRescheduleTitle: (code: string) => `Przełożenie wizyty (${code})`,
    modalRescheduleDesc: 'Wybierz nowy termin i wolną godzinę. Barber otrzyma natychmiastowe powiadomienie.',
    btnConfirmReschedule: 'Zatwierdź przełożenie',
    modalCancelTitle: (code: string) => `Czy na pewno odwołać wizytę ${code}?`,
    modalCancelDesc: 'Slot czasowy zostanie udostępniony innym klientom.',
    btnKeepVisit: 'Zostaw wizytę',
    btnConfirmCancel: 'Tak, odwołaj wizytę',

    // Master Schedule
    masterRoleChief: 'Chief Barber',
    masterRoleTop: 'Top Barber',
    masterRoleBarber: 'Barber',
    masterNewAlerts: (count: number) => `Nowe powiadomienia (${count}):`,
    btnMarkRead: 'Oznacz jako przeczytane',
    masterMetricBookings: 'Zapisy na dziś:',
    masterMetricRevenue: 'Utarg zmiany:',
    masterMetricOccupancy: 'Obłożenie:',
    masterMetricRating: 'Ocena barbera:',
    masterScheduleTitle: 'Harmonogram i lista klientów',
    masterScheduleDesc: 'Zarządzanie statusem wizyty i notatkami o preferencjach gościa',
    statusConfirmed: 'Potwierdzona',
    statusInProgress: 'Na fotelu',
    statusCompleted: 'Zakończona',
    statusCancelled: 'Odwołana',
    statusRescheduled: 'Przełożona',
    btnChair: 'Na fotelu',
    btnComplete: 'Zakończ',
    btnNote: 'Notatka',
    masterNoteLabel: 'Notatka mistrza (preferencje klienta, długość, stylizacja, ulubiony napój):',
    btnSaveNote: 'Zapisz notatkę',
    btnCancelAction: 'Anuluj',

    // Admin Dashboard
    adminTitle: 'Panel Administratora CRM',
    adminSubtitle: 'Monitorowanie przychodów, rezerwacji z botów, powiadomień i webhooków',
    adminSystemActive: 'SYSTEM AKTYWNY',
    adminTabOverview: '📊 Analityka',
    adminTabAppointments: '📅 Wszystkie wizyty',
    adminTabMasters: '✂️ Zespół i Cennik',
    adminTabBots: '⚙️ Klucze Botów & API',
    adminTabUbuntu: '🚀 Wdrożenie Ubuntu',
    metricTotalRevenue: 'Całkowity przychód',
    metricTotalBookings: 'Wszystkie rezerwacje',
    metricAverageCheck: 'Średni paragon',
    metricTeamLoad: 'Obłożenie zespołu',
    chartMessengersTitle: 'Rozkład rezerwacji według komunikatorów',
    chartMessengersDesc: 'Skąd przychodzą klienci: konwersja kanałów automatyzacji',
    teamPerformanceTitle: 'Wydajność i oceny barberów',
    searchPlaceholder: 'Szukaj po nazwisku, telefonie lub kodzie #BRB...',
    btnManualBooking: 'Zapisz gościa',
    webhookSimTitle: 'Symulator webhooków Telegram i Facebook',
    webhookSimDesc: 'Przetestuj natychmiastową rejestrację wizyty i powiadomienie fryzjera',
    btnWebhookTelegram: '⚡ Webhook Telegram',
    btnWebhookWhatsApp: '⚡ Webhook WhatsApp',
    btnWebhookInstagram: '⚡ Webhook Instagram',
    btnWebhookFacebook: '⚡ Webhook Facebook Messenger',

    // Notifications modal
    notifLogTitle: 'Dziennik powiadomień i przypomnień',
    notifLogDesc: 'Wiadomości do fryzjerów i automatyczne przypomnienia 24h / 2h dla klientów',
    btnMarkAllRead: 'Przeczytane wszystkie',
    autoReminderTest: 'Test przypomnień:',
    btnRemind24h: 'Przypomnij za 24h',
    btnRemind2h: 'Przypomnij za 2h',
    filterAll: 'Wszystkie',
    filterMasters: 'Mistrzom',
    filterClients: 'Klientom',
    btnClose: 'Zamknij',
  },

  uk: {
    langName: 'Українська',
    flag: '🇺🇦',
    currency: '₴',
    // Header
    appTagline: 'Розумний бот TG / WA / IG / FB & CRM для барбершопу',
    tabBot: 'Чат-Бот',
    tabBooking: 'Онлайн-запис / Профіль',
    tabMaster: 'Майстер',
    tabAdmin: 'Адмін CRM',
    notifications: 'Сповіщення',
    barber: 'Барбер:',

    // Bot messages & flows
    botOnline: 'онлайн • Готовий до запису',
    botWelcome: (name: string, shopName: string, channel: string) =>
      `Вітаємо, ${name}! 💈\n\nВас вітає офіційний бот преміального барбершопу **${shopName}** у ${channel.toUpperCase()}.\n\nЗапишіться до шеф-барбера за 1 хвилину, перегляньте вільні години, керуйте своїми візитами або відкрийте зручний додаток WebApp.`,
    btnOpenWebApp: '⚡ Записатись через WebApp',
    btnBookInChat: '✂️ Записатись у чаті',
    btnMyBookings: '📅 Мої записи',
    btnPriceList: '💈 Послуги та ціни',
    btnBarbers: '⭐️ Наші барбери',
    btnContacts: '📍 Контакти та адреса',
    btnSwitchLang: '🌐 Змінити мову / Switch language',
    btnMainMenu: '⬅️ Головне меню',
    botChooseService: 'Чудово! Яку послугу ви бажаєте обрати?',
    botChooseBarber: (serviceName: string, price: number, duration: number) =>
      `Ви обрали "${serviceName}" (${price} ₴, ${duration} хв).\n\nДо якого майстра бажаєте записатись?`,
    botChooseDate: (barberName: string, nickname: string, rating: number) =>
      `Барбер: ${barberName} (${nickname}) ⭐ ${rating}.\n\nОберіть зручний день для візиту:`,
    botChooseTime: (date: string) =>
      `Вільний час на ${date}:\nОберіть зручну годину:`,
    botNoSlots: (date: string) =>
      `На жаль, на ${date} у майстра немає вільних годин. Будь ласка, оберіть інший день.`,
    botBookingSuccess: (code: string, service: string, price: number, barber: string, date: string, time: string, address: string) =>
      `🎉 **Ваш візит успішно підтверджено!**\n\n` +
      `• **Код бронювання**: \`${code}\`\n` +
      `• **Послуга**: ${service} (${price} ₴)\n` +
      `• **Барбер**: ${barber}\n` +
      `• **Дата і час**: ${date} о ${time}\n` +
      `• **Адреса**: ${address}\n\n` +
      `🔔 *Майстер отримав миттєве сповіщення! Ми також надішлемо вам нагадування за 24 години та за 2 години до візиту.*`,
    btnReschedule: (code: string) => `🔄 Перенести візит (${code})`,
    btnCancel: (code: string) => `❌ Скасувати візит (${code})`,
    botCancelledSuccess: (code: string) =>
      `❌ Запис **${code}** скасовано.\n\nЧас звільнено для інших клієнтів, майстра сповіщено. Будемо раді бачити вас іншого дня!`,
    botNoActiveVisits: 'У вас наразі немає активних записів. Бажаєте записатись прямо зараз?',
    botActiveVisitsHeader: (count: number) => `📋 **Ваші актуальні записи (${count}):**\n\n`,
    botTyping: 'Бот друкує відповідь...',
    inputPlaceholder: 'Напишіть боту (напр. хочу стрижку)...',

    // Client WebApp & Booking Wizard
    webAppTitle: 'BLADE & CROWN — WebApp Сервіс',
    webAppSubtitle: 'Онлайн-бронювання та керування візитами клієнта',
    tabNewBooking: '✂️ Новий запис',
    tabProfile: '👤 Мій профіль та візити',
    stepService: 'Послуга',
    stepBarber: 'Барбер',
    stepDateTime: 'Дата і час',
    stepContacts: 'Контакти',
    step1Title: '1. Оберіть послугу барбершопу',
    step1Desc: 'Кожна послуга включає миття голови преміальними засобами та напої з бару',
    topChoice: 'Топ вибір',
    durationMin: 'хв',
    btnNextBarber: 'Далі: Обрати барбера',
    step2Title: '2. Оберіть барбера',
    step2Desc: 'Наші майстри мають багаторічний досвід та володіють найсучаснішими техніками',
    experienceYears: (years: number) => `Досвід: ${years} р.`,
    btnNextTime: 'Далі: Обрати час',
    step3Title: '3. Оберіть дату та час',
    step3Desc: 'Доступність вільних вікон оновлюється в реальному часі',
    labelDate: 'Дата візиту:',
    labelAvailableHours: (date: string) => `Вільні години на ${date}:`,
    btnNextContacts: 'Далі: Контактні дані',
    step4Title: '4. Підтвердження та контакти',
    step4Desc: 'Вкажіть ім\'я та телефон для підтвердження і відправки нагадувань',
    labelName: 'Ваше ім\'я *',
    labelPhone: 'Номер телефону *',
    labelChannel: 'Канал для сповіщень та нагадувань:',
    labelNotes: 'Побажання до візиту (необов\'язково)',
    notesPlaceholder: 'Наприклад: фейд з нуля, кава американо...',
    btnFinishBooking: 'Підтвердити запис',
    bookingSuccessTitle: 'Ви успішно записані!',
    bookingSuccessDesc: (channel: string) => `Ми надіслали підтвердження у ваш ${channel.toUpperCase()} та сповістили майстра.`,
    bookingCodeLabel: 'Код бронювання:',
    btnGoToVisits: 'Перейти до моїх візитів',
    btnBookAnother: 'Записатись ще раз',
    clientLoyaltyCard: 'КАРТКА ПОСТІЙНОГО ГОСТЯ',
    clientDiscount: 'Клубна знижка: 10% • Кількість візитів:',
    activeBookingsTitle: (count: number) => `Активні записи (${count})`,
    noActiveBookings: 'У вас немає запланованих візитів',
    btnRescheduleVisit: 'Перенести візит',
    btnCancelVisit: 'Скасувати',
    visitHistoryTitle: (count: number) => `Історія візитів (${count})`,
    modalRescheduleTitle: (code: string) => `Перенесення візиту (${code})`,
    modalRescheduleDesc: 'Оберіть нову дату та вільну годину. Барбер отримає миттєве сповіщення.',
    btnConfirmReschedule: 'Підтвердити перенесення',
    modalCancelTitle: (code: string) => `Скасувати запис ${code}?`,
    modalCancelDesc: 'Вільний слот стане доступним для інших відвідувачів.',
    btnKeepVisit: 'Залишити запис',
    btnConfirmCancel: 'Так, скасувати візит',

    // Master Schedule
    masterRoleChief: 'Шеф-барбер',
    masterRoleTop: 'Топ-барбер',
    masterRoleBarber: 'Барбер',
    masterNewAlerts: (count: number) => `Нові сповіщення (${count}):`,
    btnMarkRead: 'Позначити прочитаними',
    masterMetricBookings: 'Записів на день:',
    masterMetricRevenue: 'Каса зміни:',
    masterMetricOccupancy: 'Завантаження:',
    masterMetricRating: 'Рейтинг майстра:',
    masterScheduleTitle: 'Розклад та список клієнтів',
    masterScheduleDesc: 'Керування статусом візиту та індивідуальними нотатками',
    statusConfirmed: 'Підтверджена',
    statusInProgress: 'У кріслі',
    statusCompleted: 'Завершено',
    statusCancelled: 'Скасовано',
    statusRescheduled: 'Перенесено',
    btnChair: 'У кріслі',
    btnComplete: 'Завершити',
    btnNote: 'Нотатка',
    masterNoteLabel: 'Нотатка майстра (довжина насадки, вподобання клієнта, напої):',
    btnSaveNote: 'Зберегти нотатку',
    btnCancelAction: 'Скасувати',

    // Admin Dashboard
    adminTitle: 'Панель Адміністратора CRM',
    adminSubtitle: 'Моніторинг виручки, записів з ботів, сповіщень та вебхуків',
    adminSystemActive: 'СИСТЕМА АКТИВНА',
    adminTabOverview: '📊 Аналітика',
    adminTabAppointments: '📅 Усі записи',
    adminTabMasters: '✂️ Команда та Ціни',
    adminTabBots: '⚙️ Ключі Ботів & API',
    adminTabUbuntu: '🚀 Розгортання Ubuntu',
    metricTotalRevenue: 'Загальна виручка',
    metricTotalBookings: 'Усього записів',
    metricAverageCheck: 'Середній чек',
    metricTeamLoad: 'Завантаження команди',
    chartMessengersTitle: 'Розподіл записів за месенджерами',
    chartMessengersDesc: 'Звідки приходять клієнти: конверсія каналів автоматизації',
    teamPerformanceTitle: 'Продуктивність та рейтинг барберів',
    searchPlaceholder: 'Пошук за ім\'ям, телефоном або кодом #BRB...',
    btnManualBooking: 'Записати гостя',
    webhookSimTitle: 'Симулятор вебхуків Telegram та Facebook',
    webhookSimDesc: 'Перевірте миттєву реєстрацію візиту та сповіщення майстра',
    btnWebhookTelegram: '⚡ Вебхук Telegram',
    btnWebhookWhatsApp: '⚡ Вебхук WhatsApp',
    btnWebhookInstagram: '⚡ Вебхук Instagram',
    btnWebhookFacebook: '⚡ Вебхук Facebook Messenger',

    // Notifications modal
    notifLogTitle: 'Журнал сповіщень та нагадувань',
    notifLogDesc: 'Повідомлення для майстрів та автонагадування 24г / 2г для клієнтів',
    btnMarkAllRead: 'Прочитати все',
    autoReminderTest: 'Тест нагадувань:',
    btnRemind24h: 'Нагадати за 24г',
    btnRemind2h: 'Нагадати за 2г',
    filterAll: 'Усі',
    filterMasters: 'Майстрам',
    filterClients: 'Клієнтам',
    btnClose: 'Закрити',
  },

  ru: {
    langName: 'Русский',
    flag: '🇷🇺',
    currency: '₽',
    // Header
    appTagline: 'Умный бот TG / WA / IG / FB & CRM для барбершопа',
    tabBot: 'Чат-Бот',
    tabBooking: 'Онлайн-запись / Профиль',
    tabMaster: 'Мастер',
    tabAdmin: 'Админ CRM',
    notifications: 'Уведомления',
    barber: 'Барбер:',

    // Bot messages & flows
    botOnline: 'онлайн • Готов к записи',
    botWelcome: (name: string, shopName: string, channel: string) =>
      `Здравствуйте, ${name}! 💈\n\nВас приветствует умный бот премиум-барбершопа **${shopName}** в ${channel.toUpperCase()}.\n\nЗапишитесь к шеф-барберу за 1 минуту, посмотрите доступное время, управляйте своими визитами или откройте интерактивный WebApp.`,
    btnOpenWebApp: '⚡ Записаться через WebApp',
    btnBookInChat: '✂️ Записаться в чате',
    btnMyBookings: '📅 Мои записи',
    btnPriceList: '💈 Услуги и цены',
    btnBarbers: '⭐️ Барберы',
    btnContacts: '📍 Контакты и адрес',
    btnSwitchLang: '🌐 Сменить язык / Switch language',
    btnMainMenu: '⬅️ Главное меню',
    botChooseService: 'Отлично! Какую услугу вы хотите выбрать?',
    botChooseBarber: (serviceName: string, price: number, duration: number) =>
      `Вы выбрали "${serviceName}" (${price} ₽, ${duration} мин).\n\nК какому барберу хотите записаться?`,
    botChooseDate: (barberName: string, nickname: string, rating: number) =>
      `Мастер: ${barberName} (${nickname}) ⭐ ${rating}.\n\nВыберите подходящий день:`,
    botChooseTime: (date: string) =>
      `Свободное время на ${date}:\nВыберите удобный интервал:`,
    botNoSlots: (date: string) =>
      `К сожалению, на ${date} у мастера нет свободных слотов. Пожалуйста, выберите другой день.`,
    botBookingSuccess: (code: string, service: string, price: number, barber: string, date: string, time: string, address: string) =>
      `🎉 **Ваша запись успешно подтверждена!**\n\n` +
      `• **Код брони**: \`${code}\`\n` +
      `• **Услуга**: ${service} (${price} ₽)\n` +
      `• **Барбер**: ${barber}\n` +
      `• **Дата и время**: ${date} в ${time}\n` +
      `• **Адрес**: ${address}\n\n` +
      `🔔 *Мастер уже получил автоматическое уведомление! Мы также пришлем вам напоминание за 24ч и за 2ч.*`,
    btnReschedule: (code: string) => `🔄 Перенести визит (${code})`,
    btnCancel: (code: string) => `❌ Отменить визит (${code})`,
    botCancelledSuccess: (code: string) =>
      `❌ Запись **${code}** успешно отменена.\n\nМастер оповещен, временной слот снова открыт для бронирования. Будем рады видеть вас в другое удобное время!`,
    botNoActiveVisits: 'У вас пока нет активных записей. Хотите записаться прямо сейчас?',
    botActiveVisitsHeader: (count: number) => `📋 **Ваши актуальные записи (${count}):**\n\n`,
    botTyping: 'Бот печатает ответ...',
    inputPlaceholder: 'Напишите боту (напр. хочу стрижку)...',

    // Client WebApp & Booking Wizard
    webAppTitle: 'BLADE & CROWN — WebApp Сервис',
    webAppSubtitle: 'Онлайн-бронирование и управление визитами клиента',
    tabNewBooking: '✂️ Новая запись',
    tabProfile: '👤 Мой профиль и визиты',
    stepService: 'Услуга',
    stepBarber: 'Барбер',
    stepDateTime: 'Дата и время',
    stepContacts: 'Контакты',
    step1Title: '1. Выберите услугу барбершопа',
    step1Desc: 'Все услуги включают мытье головы премиальным уходом и напитки из бара',
    topChoice: 'Топ выбор',
    durationMin: 'мин',
    btnNextBarber: 'Далее: Выбрать барбера',
    step2Title: '2. Выберите барбера',
    step2Desc: 'Наши мастера имеют опыт от 3 до 9 лет и владеют классическими и современными техниками',
    experienceYears: (years: number) => `Стаж: ${years} лет`,
    btnNextTime: 'Далее: Выбрать время',
    step3Title: '3. Выберите дату и время визита',
    step3Desc: 'Доступность слотов обновляется в режиме реального времени',
    labelDate: 'Дата посещения:',
    labelAvailableHours: (date: string) => `Доступное время на ${date}:`,
    btnNextContacts: 'Далее: Контакты',
    step4Title: '4. Подтверждение и контактные данные',
    step4Desc: 'Укажите имя и телефон для подтверждения записи и получения напоминаний',
    labelName: 'Ваше имя *',
    labelPhone: 'Номер телефона *',
    labelChannel: 'Канал для уведомлений и напоминаний:',
    labelNotes: 'Пожелания к визиту (опционально)',
    notesPlaceholder: 'Например: хочу переход с нуля, кофе американо...',
    btnFinishBooking: 'Завершить запись',
    bookingSuccessTitle: 'Вы успешно записаны!',
    bookingSuccessDesc: (channel: string) => `Мы отправили подтверждение в ваш ${channel.toUpperCase()} и уведомили барбера.`,
    bookingCodeLabel: 'Код бронирования:',
    btnGoToVisits: 'Перейти в мои визиты',
    btnBookAnother: 'Записаться ещё раз',
    clientLoyaltyCard: 'КАРТА ПОСТОЯННОГО ГОСТЯ',
    clientDiscount: 'Скидка постоянного гостя: 10% • Визитов в клубе:',
    activeBookingsTitle: (count: number) => `Активные записи (${count})`,
    noActiveBookings: 'У вас нет запланированных визитов',
    btnRescheduleVisit: 'Перенести визит',
    btnCancelVisit: 'Отменить',
    visitHistoryTitle: (count: number) => `История визитов (${count})`,
    modalRescheduleTitle: (code: string) => `Перенос визита (${code})`,
    modalRescheduleDesc: 'Выберите новую дату и свободный слот у мастера. Мастер сразу получит уведомление о переносе.',
    btnConfirmReschedule: 'Подтвердить перенос',
    modalCancelTitle: (code: string) => `Отменить запись ${code}?`,
    modalCancelDesc: 'Временной слот освободится для других гостей.',
    btnKeepVisit: 'Оставить запись',
    btnConfirmCancel: 'Да, отменить визит',

    // Master Schedule
    masterRoleChief: 'Шеф-барбер',
    masterRoleTop: 'Топ-барбер',
    masterRoleBarber: 'Барбер',
    masterNewAlerts: (count: number) => `Новые уведомления (${count}):`,
    btnMarkRead: 'Отметить прочитанными',
    masterMetricBookings: 'Записей на день:',
    masterMetricRevenue: 'Выручка за смену:',
    masterMetricOccupancy: 'Загрузка мастера:',
    masterMetricRating: 'Рейтинг мастера:',
    masterScheduleTitle: 'Расписание и клиенты мастера',
    masterScheduleDesc: 'Быстрое управление статусами визита и индивидуальными заметками',
    statusConfirmed: 'Подтверждена',
    statusInProgress: 'В кресле',
    statusCompleted: 'Завершено',
    statusCancelled: 'Отменена',
    statusRescheduled: 'Перенесена',
    btnChair: 'В кресле',
    btnComplete: 'Завершить',
    btnNote: 'Заметка',
    masterNoteLabel: 'Заметка мастера (предпочтения по стрижке, стайлинг, напиток):',
    btnSaveNote: 'Сохранить заметку',
    btnCancelAction: 'Отмена',

    // Admin Dashboard
    adminTitle: 'Панель Администратора CRM',
    adminSubtitle: 'Мониторинг выручки, бронирований из ботов, автоуведомлений мастеров и вебхуков',
    adminSystemActive: 'СИСТЕМА АКТИВНА',
    adminTabOverview: '📊 Аналитика',
    adminTabAppointments: '📅 Все записи',
    adminTabMasters: '✂️ Мастера и Услуги',
    adminTabBots: '⚙️ Ключи Ботов & API',
    adminTabUbuntu: '🚀 Развертывание Ubuntu',
    metricTotalRevenue: 'Общая выручка',
    metricTotalBookings: 'Всего записей',
    metricAverageCheck: 'Средний чек',
    metricTeamLoad: 'Загрузка мастеров',
    chartMessengersTitle: 'Распределение записей по мессенджерам',
    chartMessengersDesc: 'Откуда приходят клиенты: конверсия каналов автоматизации',
    teamPerformanceTitle: 'Загрузка и рейтинг барберов',
    searchPlaceholder: 'Поиск по имени, телефону или коду #BRB...',
    btnManualBooking: 'Записать гостя',
    webhookSimTitle: 'Симулятор входящих вебхуков Telegram и Facebook',
    webhookSimDesc: 'Проверьте мгновенную регистрацию записи и отправку пуш-уведомления мастеру',
    btnWebhookTelegram: '⚡ Вебхук Telegram',
    btnWebhookWhatsApp: '⚡ Вебхук WhatsApp',
    btnWebhookInstagram: '⚡ Вебхук Instagram',
    btnWebhookFacebook: '⚡ Вебхук Facebook Messenger',

    // Notifications modal
    notifLogTitle: 'Лог уведомлений и напоминаний',
    notifLogDesc: 'Оповещения мастеров и напоминания клиентам через ботов',
    btnMarkAllRead: 'Прочитать все',
    autoReminderTest: 'Тест авторассылки:',
    btnRemind24h: 'Напомнить за 24ч',
    btnRemind2h: 'Напомнить за 2ч',
    filterAll: 'Все',
    filterMasters: 'Мастерам',
    filterClients: 'Клиентам',
    btnClose: 'Закрыть',
  },
};
