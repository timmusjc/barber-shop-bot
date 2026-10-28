import { Appointment, ChannelType, Language, Master, NotificationItem, Service } from '../types';

export const WORK_HOURS = [
  '10:00', '10:30', '11:00', '11:30', 
  '12:00', '12:30', '13:00', '13:30', 
  '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', 
  '20:00'
];

export function getAvailableSlots(
  masterId: string,
  date: string,
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): string[] {
  const bookedSlots = new Set(
    existingAppointments
      .filter(
        app =>
          app.masterId === masterId &&
          app.date === date &&
          app.status !== 'cancelled' &&
          app.id !== excludeAppointmentId
      )
      .map(app => app.timeSlot)
  );

  return WORK_HOURS.filter(slot => !bookedSlots.has(slot));
}

export function generateBookingCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BRB-${num}`;
}

export interface CreateBookingParams {
  clientName: string;
  clientPhone: string;
  clientHandle?: string;
  channel: ChannelType | 'web';
  language?: Language;
  masterId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  notes?: string;
  price: number;
}

export function createBooking(
  params: CreateBookingParams,
  existingAppointments: Appointment[],
  lang: Language = 'pl'
): { success: boolean; appointment?: Appointment; error?: string } {
  const errMessages = {
    pl: {
      name: 'Wpisz swoje imię i nazwisko',
      phone: 'Wpisz poprawny numer telefonu',
      dateTime: 'Wybierz datę i godzinę',
      occupied: 'Wybrana godzina jest już zajęta przez innego klienta',
    },
    uk: {
      name: 'Вкажіть ваше ім\'я',
      phone: 'Вкажіть коректний номер телефону',
      dateTime: 'Оберіть дату та час',
      occupied: 'Обраний час уже зайнято іншим гостем',
    },
    ru: {
      name: 'Укажите ваше имя',
      phone: 'Укажите корректный номер телефона',
      dateTime: 'Выберите дату и время',
      occupied: 'Выбранное время уже занято другим клиентом',
    },
  };

  const msgs = errMessages[lang] || errMessages.pl;

  if (!params.clientName.trim()) {
    return { success: false, error: msgs.name };
  }
  if (!params.clientPhone.trim() || params.clientPhone.replace(/\D/g, '').length < 8) {
    return { success: false, error: msgs.phone };
  }
  if (!params.date || !params.timeSlot) {
    return { success: false, error: msgs.dateTime };
  }

  // Check collision
  const availableSlots = getAvailableSlots(params.masterId, params.date, existingAppointments);
  if (!availableSlots.includes(params.timeSlot)) {
    return { success: false, error: msgs.occupied };
  }

  const newAppointment: Appointment = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bookingCode: generateBookingCode(),
    clientName: params.clientName.trim(),
    clientPhone: params.clientPhone.trim(),
    clientHandle: params.clientHandle?.trim(),
    channel: params.channel,
    language: params.language || lang,
    masterId: params.masterId,
    serviceId: params.serviceId,
    date: params.date,
    timeSlot: params.timeSlot,
    status: 'confirmed',
    notes: params.notes?.trim() || '',
    barberNotes: '',
    price: params.price,
    createdAt: new Date().toISOString(),
    remindersSent: {
      dayBefore: false,
      hoursBefore: false,
    },
  };

  return { success: true, appointment: newAppointment };
}

export function rescheduleBooking(
  appointmentId: string,
  newDate: string,
  newTimeSlot: string,
  appointments: Appointment[],
  lang: Language = 'pl'
): { success: boolean; updatedAppointment?: Appointment; error?: string } {
  const errMessages = {
    pl: {
      notFound: 'Nie znaleziono rezerwacji',
      cancelled: 'Nie można przełożyć odwołanej wizyty',
      occupied: 'Wybrana godzina u tego mistrza jest już zajęta',
    },
    uk: {
      notFound: 'Запис не знайдено',
      cancelled: 'Неможливо перенести скасований візит',
      occupied: 'Обраний час у майстра вже зайнятий',
    },
    ru: {
      notFound: 'Запись не найдена',
      cancelled: 'Нельзя перенести отменённую запись',
      occupied: 'Выбранное время у мастера уже занято',
    },
  };

  const msgs = errMessages[lang] || errMessages.pl;
  const target = appointments.find(a => a.id === appointmentId);
  if (!target) {
    return { success: false, error: msgs.notFound };
  }

  if (target.status === 'cancelled') {
    return { success: false, error: msgs.cancelled };
  }

  const available = getAvailableSlots(target.masterId, newDate, appointments, target.id);
  if (!available.includes(newTimeSlot)) {
    return { success: false, error: msgs.occupied };
  }

  const updatedAppointment: Appointment = {
    ...target,
    date: newDate,
    timeSlot: newTimeSlot,
    status: 'rescheduled',
  };

  return { success: true, updatedAppointment };
}

export function cancelBooking(
  appointmentId: string,
  appointments: Appointment[]
): { success: boolean; updatedAppointment?: Appointment; error?: string } {
  const target = appointments.find(a => a.id === appointmentId);
  if (!target) {
    return { success: false, error: 'Wizyta nie znaleziona' };
  }

  const updatedAppointment: Appointment = {
    ...target,
    status: 'cancelled',
  };

  return { success: true, updatedAppointment };
}

export function generateMasterNotification(
  type: 'new_booking' | 'rescheduled' | 'cancelled',
  appointment: Appointment,
  master: Master,
  service: Service,
  lang: Language = 'pl'
): NotificationItem {
  const now = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const sName = service.name[lang] || service.name.pl;
  let title = '';
  let message = '';

  if (lang === 'pl') {
    switch (type) {
      case 'new_booking':
        title = `✂️ Nowa wizyta: ${appointment.clientName}`;
        message = `Klient ${appointment.clientName} (${appointment.clientPhone}) zapisał się na "${sName}". Data: ${appointment.date} o ${appointment.timeSlot}. Kanał: ${appointment.channel.toUpperCase()}.`;
        break;
      case 'rescheduled':
        title = `⚠️ Przełożenie wizyty: ${appointment.clientName}`;
        message = `Klient ${appointment.clientName} przełożył wizytę na "${sName}" na nowy termin: ${appointment.date} o ${appointment.timeSlot}.`;
        break;
      case 'cancelled':
        title = `❌ Wizyta odwołana: ${appointment.clientName}`;
        message = `Wizyta klienta ${appointment.clientName} na ${appointment.date} o ${appointment.timeSlot} została odwołana. Termin jest znów wolny.`;
        break;
    }
  } else if (lang === 'uk') {
    switch (type) {
      case 'new_booking':
        title = `✂️ Новий запис до вас: ${appointment.clientName}`;
        message = `Клієнт ${appointment.clientName} (${appointment.clientPhone}) записався на "${sName}". Дата: ${appointment.date} о ${appointment.timeSlot}. Джерело: ${appointment.channel.toUpperCase()}.`;
        break;
      case 'rescheduled':
        title = `⚠️ Перенесення запису: ${appointment.clientName}`;
        message = `Клієнт ${appointment.clientName} переніс візит на "${sName}" на новий час: ${appointment.date} о ${appointment.timeSlot}.`;
        break;
      case 'cancelled':
        title = `❌ Запис скасовано: ${appointment.clientName}`;
        message = `Візит клієнта ${appointment.clientName} на ${appointment.date} о ${appointment.timeSlot} скасовано. Слот знову вільний.`;
        break;
    }
  } else {
    switch (type) {
      case 'new_booking':
        title = `✂️ Новая запись к вам: ${appointment.clientName}`;
        message = `Клиент ${appointment.clientName} (${appointment.clientPhone}) записался на "${sName}". Дата: ${appointment.date} в ${appointment.timeSlot}. Источник: ${appointment.channel.toUpperCase()}.`;
        break;
      case 'rescheduled':
        title = `⚠️ Перенос записи: ${appointment.clientName}`;
        message = `Клиент ${appointment.clientName} перенёс запись на "${sName}" на новое время: ${appointment.date} в ${appointment.timeSlot}.`;
        break;
      case 'cancelled':
        title = `❌ Запись отменена: ${appointment.clientName}`;
        message = `Запись клиента ${appointment.clientName} на ${appointment.date} в ${appointment.timeSlot} была отменена. Слот снова свободен.`;
        break;
    }
  }

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientType: 'master',
    recipientId: master.id,
    recipientName: master.name,
    channel: 'push',
    title,
    message,
    timestamp: now,
    read: false,
    appointmentId: appointment.id,
    type,
  };
}

export function generateClientReminder(
  type: 'reminder_24h' | 'reminder_2h',
  appointment: Appointment,
  master: Master,
  service: Service,
  lang: Language = 'pl'
): NotificationItem {
  const now = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const is24h = type === 'reminder_24h';
  const sName = service.name[lang] || service.name.pl;
  let title = '';
  let message = '';

  if (lang === 'pl') {
    title = is24h
      ? `🔔 Przypomnienie: Twoja wizyta jutro o ${appointment.timeSlot}`
      : `⏰ Czekamy na Ciebie za 2 godziny o ${appointment.timeSlot}!`;
    message = is24h
      ? `Dzień dobry, ${appointment.clientName}! Przypominamy o Twojej wizycie w barbershopie jutro (${appointment.date}) o ${appointment.timeSlot}. Mistrz: ${master.name}. Usługa: ${sName}. Jeśli plany uległy zmianie, możesz przełożyć termin w profilu.`
      : `Dzień dobry, ${appointment.clientName}! Twój barber ${master.name} przygotowuje stanowisko na ${appointment.timeSlot}. Czekamy pod adresem: ul. Marszałkowska 84/2. Tel: +48 22 890 45 77.`;
  } else if (lang === 'uk') {
    title = is24h
      ? `🔔 Нагадування: ваш візит завтра о ${appointment.timeSlot}`
      : `⏰ Чекаємо на вас через 2 години о ${appointment.timeSlot}!`;
    message = is24h
      ? `Доброго дня, ${appointment.clientName}! Нагадуємо про ваш запис у барбершоп на завтра (${appointment.date}) о ${appointment.timeSlot}. Майстер: ${master.name}. Послуга: ${sName}. Якщо плани змінились, ви можете перенести візит у профілі.`
      : `Доброго дня, ${appointment.clientName}! Ваш барбер ${master.name} готує крісло на ${appointment.timeSlot}. Чекаємо за адресою: вул. Велика Васильківська 28.`;
  } else {
    title = is24h
      ? `🔔 Напоминание: ваш визит завтра в ${appointment.timeSlot}`
      : `⏰ Ждём вас через 2 часа в ${appointment.timeSlot}!`;
    message = is24h
      ? `Здравствуйте, ${appointment.clientName}! Напоминаем о вашей записи в барбершоп на завтра (${appointment.date}) в ${appointment.timeSlot}. Мастер: ${master.name}. Услуга: ${sName}. Если планы изменились, вы можете перенести визит в профиле.`
      : `Добрый день, ${appointment.clientName}! Ваш барбер ${master.name} уже готовит рабочее место к ${appointment.timeSlot}. Ждём вас по адресу: ул. Большая Дмитровка 14с2.`;
  }

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientType: 'client',
    recipientId: appointment.clientPhone,
    recipientName: appointment.clientName,
    channel: appointment.channel === 'web' ? 'sms' : (appointment.channel as ChannelType),
    title,
    message,
    timestamp: now,
    read: false,
    appointmentId: appointment.id,
    type,
  };
}

export interface StatsSummary {
  totalRevenue: number;
  totalAppointments: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  averageCheck: number;
  channelBreakdown: Record<string, number>;
  topMasterName: string;
  masterOccupancyPercent: number;
}

export function calculateStats(
  appointments: Appointment[],
  masters: Master[],
  services: Service[]
): StatsSummary {
  const serviceMap = new Map(services.map(s => [s.id, s]));
  const masterMap = new Map(masters.map(m => [m.id, m]));

  const validAppointments = appointments.filter(a => a.status !== 'cancelled');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const confirmedCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'rescheduled').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  const totalRevenue = appointments
    .filter(a => a.status === 'completed' || a.status === 'confirmed' || a.status === 'in_progress')
    .reduce((sum, app) => sum + (app.price || serviceMap.get(app.serviceId)?.price || 0), 0);

  const averageCheck = validAppointments.length > 0 
    ? Math.round(totalRevenue / validAppointments.length) 
    : 0;

  const channelBreakdown: Record<string, number> = {
    telegram: 0,
    whatsapp: 0,
    instagram: 0,
    facebook: 0,
    web: 0,
  };

  appointments.forEach(app => {
    if (channelBreakdown[app.channel] !== undefined) {
      channelBreakdown[app.channel]++;
    }
  });

  const masterCounts: Record<string, number> = {};
  validAppointments.forEach(app => {
    masterCounts[app.masterId] = (masterCounts[app.masterId] || 0) + 1;
  });

  let topMasterId = '';
  let maxCount = -1;
  Object.entries(masterCounts).forEach(([mId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topMasterId = mId;
    }
  });

  const topMasterName = topMasterId ? (masterMap.get(topMasterId)?.name || 'Brak danych') : '—';
  const totalAvailableSlots = Math.max(1, masters.length * 10);
  const masterOccupancyPercent = Math.min(100, Math.round((validAppointments.length / totalAvailableSlots) * 100));

  return {
    totalRevenue,
    totalAppointments: appointments.length,
    confirmedCount,
    completedCount: completedAppointments.length,
    cancelledCount,
    averageCheck,
    channelBreakdown,
    topMasterName,
    masterOccupancyPercent,
  };
}

// Validator for Telegram Bot Token format (<numbers>:<alphanumeric>)
export function validateTelegramBotToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  // Standard format from BotFather: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567
  return /^\d{8,12}:[a-zA-Z0-9_-]{30,50}$/.test(trimmed);
}

// Validator for Facebook Page Access Token
export function validateFacebookToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.length >= 30 && (trimmed.startsWith('EA') || trimmed.startsWith('EAA') || trimmed.length > 40);
}
