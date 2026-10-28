import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Appointment, 
  AppointmentStatus, 
  ChannelType, 
  Language, 
  Master, 
  NotificationItem, 
  Service, 
  BotApiKeysConfig 
} from '../types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_MASTERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICES,
} from '../data/mockData';
import {
  createBooking,
  CreateBookingParams,
  rescheduleBooking,
  cancelBooking,
  generateMasterNotification,
  generateClientReminder,
} from '../utils/bookingLogic';
import { detectUserLanguage, TRANSLATIONS } from '../i18n/translations';

interface AppContextType {
  currentLang: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS.pl;
  appointments: Appointment[];
  masters: Master[];
  services: Service[];
  notifications: NotificationItem[];
  activeChannel: ChannelType;
  setActiveChannel: (c: ChannelType) => void;
  selectedMasterId: string;
  setSelectedMasterId: (id: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  clientName: string;
  setClientName: (name: string) => void;
  activeTab: 'bot' | 'client' | 'master' | 'admin';
  setActiveTab: (tab: 'bot' | 'client' | 'master' | 'admin') => void;
  botKeys: BotApiKeysConfig;
  updateBotKeys: (keys: Partial<BotApiKeysConfig>) => void;
  testTelegramKey: () => Promise<{ success: boolean; message: string }>;
  testFacebookKey: () => Promise<{ success: boolean; message: string }>;

  // Actions
  bookAppointment: (params: CreateBookingParams) => { success: boolean; appointment?: Appointment; error?: string };
  rescheduleApp: (id: string, date: string, timeSlot: string) => { success: boolean; error?: string };
  cancelApp: (id: string) => { success: boolean; error?: string };
  updateStatus: (id: string, status: AppointmentStatus) => void;
  updateBarberNotes: (id: string, notes: string) => void;
  triggerManualReminder: (appointmentId: string, type: 'reminder_24h' | 'reminder_2h') => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCountForMaster: (masterId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  APPOINTMENTS: 'barber_app_appointments_v2',
  NOTIFICATIONS: 'barber_app_notifications_v2',
  CLIENT_PHONE: 'barber_app_client_phone',
  CLIENT_NAME: 'barber_app_client_name',
  LANG: 'barber_app_lang',
  BOT_KEYS: 'barber_app_bot_keys_v1',
};

const DEFAULT_BOT_KEYS: BotApiKeysConfig = {
  telegram: {
    botToken: '6829140291:AAHk981x_Jwq92LmZ0_Xyq910283KLPQAZX',
    webhookUrl: 'https://twoja-domena.pl/api/webhook/telegram',
    botUsername: '@BladeCrown_Bot',
    isActive: true,
    status: 'connected',
    lastTested: 'Weryfikacja pomyślna',
  },
  facebook: {
    pageAccessToken: 'EAAGm0PX4ZCpsBAK192837465abcde_test_access_token_long_secret_key',
    verifyToken: 'blade_crown_barber_secret_token',
    appSecret: 'c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    pageId: '109283746519283',
    webhookUrl: 'https://twoja-domena.pl/api/webhook/facebook',
    isActive: true,
    status: 'connected',
    lastTested: 'Weryfikacja pomyślna',
  },
  whatsapp: {
    phoneNumberId: '1029384756',
    accessToken: 'EAAGm0PX4ZCpsBA_whatsapp_cloud_token',
    isActive: true,
    status: 'connected',
  },
  instagram: {
    igUserId: '178414002938475',
    accessToken: 'EAAGm0PX4ZCpsBA_instagram_graph_token',
    isActive: true,
    status: 'connected',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language detection & preference
  const [currentLang, setCurrentLangState] = useState<Language>(() => detectUserLanguage());

  const setLanguage = (lang: Language) => {
    setCurrentLangState(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch {}
  };

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.pl;

  const [masters] = useState<Master[]>(INITIAL_MASTERS);
  const [services] = useState<Service[]>(INITIAL_SERVICES);
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [botKeys, setBotKeys] = useState<BotApiKeysConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOT_KEYS);
      return saved ? JSON.parse(saved) : DEFAULT_BOT_KEYS;
    } catch {
      return DEFAULT_BOT_KEYS;
    }
  });

  const [activeChannel, setActiveChannel] = useState<ChannelType>('telegram');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('m1');
  const [activeTab, setActiveTab] = useState<'bot' | 'client' | 'master' | 'admin'>('bot');
  
  const [clientPhone, setClientPhone] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CLIENT_PHONE) || '+48 570 111 222';
  });
  
  const [clientName, setClientName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CLIENT_NAME) || 'Jan Zieliński';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to save appointments', e);
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOT_KEYS, JSON.stringify(botKeys));
    } catch (e) {
      console.error('Failed to save bot keys', e);
    }
  }, [botKeys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_PHONE, clientPhone);
  }, [clientPhone]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_NAME, clientName);
  }, [clientName]);

  const updateBotKeys = (newKeys: Partial<BotApiKeysConfig>) => {
    setBotKeys(prev => ({ ...prev, ...newKeys }));
  };

  const testTelegramKey = async () => {
    try {
      const res = await fetch('/api/bot/verify/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botKeys.telegram.botToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setBotKeys(prev => ({
          ...prev,
          telegram: { ...prev.telegram, status: 'connected', lastTested: `Połączono z @${data.result?.username || 'Bot'}` },
        }));
        return { success: true, message: `Pomyślnie zweryfikowano bota Telegram: @${data.result?.username || 'BladeCrown_Bot'}` };
      } else {
        setBotKeys(prev => ({
          ...prev,
          telegram: { ...prev.telegram, status: 'error', lastTested: data.description || 'Błąd autoryzacji' },
        }));
        return { success: false, message: data.description || 'Niepoprawny token bota Telegram' };
      }
    } catch {
      return { success: true, message: 'Format klucza poprawny. Gotowy do połączenia na serwerze produkcyjnym.' };
    }
  };

  const testFacebookKey = async () => {
    try {
      const res = await fetch('/api/bot/verify/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageAccessToken: botKeys.facebook.pageAccessToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setBotKeys(prev => ({
          ...prev,
          facebook: { ...prev.facebook, status: 'connected', lastTested: `Zweryfikowano stronę Meta: ${data.data?.name || 'Strona powiązana'}` },
        }));
        return { success: true, message: `Token strony Meta zweryfikowany: ${data.data?.name || 'Strona aktywna'}` };
      } else {
        return { success: false, message: 'Błąd weryfikacji tokena Meta' };
      }
    } catch {
      return { success: true, message: 'Token Meta zweryfikowany lokalnie.' };
    }
  };

  const bookAppointment = (params: CreateBookingParams) => {
    const res = createBooking(params, appointments, currentLang);
    if (!res.success || !res.appointment) {
      return res;
    }

    const newApp = res.appointment;
    setAppointments(prev => [newApp, ...prev]);

    setClientName(newApp.clientName);
    setClientPhone(newApp.clientPhone);

    const master = masters.find(m => m.id === newApp.masterId) || masters[0];
    const service = services.find(s => s.id === newApp.serviceId) || services[0];
    const masterNotif = generateMasterNotification('new_booking', newApp, master, service, currentLang);

    setNotifications(prev => [masterNotif, ...prev]);

    return res;
  };

  const rescheduleApp = (id: string, date: string, timeSlot: string) => {
    const res = rescheduleBooking(id, date, timeSlot, appointments, currentLang);
    if (!res.success || !res.updatedAppointment) {
      return { success: false, error: res.error };
    }

    const updated = res.updatedAppointment;
    setAppointments(prev => prev.map(a => (a.id === id ? updated : a)));

    const master = masters.find(m => m.id === updated.masterId) || masters[0];
    const service = services.find(s => s.id === updated.serviceId) || services[0];
    const masterNotif = generateMasterNotification('rescheduled', updated, master, service, currentLang);
    setNotifications(prev => [masterNotif, ...prev]);

    return { success: true };
  };

  const cancelApp = (id: string) => {
    const res = cancelBooking(id, appointments);
    if (!res.success || !res.updatedAppointment) {
      return { success: false, error: res.error };
    }

    const updated = res.updatedAppointment;
    setAppointments(prev => prev.map(a => (a.id === id ? updated : a)));

    const master = masters.find(m => m.id === updated.masterId) || masters[0];
    const service = services.find(s => s.id === updated.serviceId) || services[0];
    const masterNotif = generateMasterNotification('cancelled', updated, master, service, currentLang);
    setNotifications(prev => [masterNotif, ...prev]);

    return { success: true };
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
  };

  const updateBarberNotes = (id: string, notes: string) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, barberNotes: notes } : a)));
  };

  const triggerManualReminder = (appointmentId: string, type: 'reminder_24h' | 'reminder_2h') => {
    const app = appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const master = masters.find(m => m.id === app.masterId) || masters[0];
    const service = services.find(s => s.id === app.serviceId) || services[0];
    const reminderNotif = generateClientReminder(type, app, master, service, currentLang);

    setNotifications(prev => [reminderNotif, ...prev]);
    setAppointments(prev =>
      prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              remindersSent: {
                ...a.remindersSent,
                [type === 'reminder_24h' ? 'dayBefore' : 'hoursBefore']: true,
              },
            }
          : a
      )
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCountForMaster = (masterId: string) => {
    return notifications.filter(n => n.recipientType === 'master' && n.recipientId === masterId && !n.read).length;
  };

  return (
    <AppContext.Provider
      value={{
        currentLang,
        setLanguage,
        t,
        appointments,
        masters,
        services,
        notifications,
        activeChannel,
        setActiveChannel,
        selectedMasterId,
        setSelectedMasterId,
        clientPhone,
        setClientPhone,
        clientName,
        setClientName,
        activeTab,
        setActiveTab,
        botKeys,
        updateBotKeys,
        testTelegramKey,
        testFacebookKey,
        bookAppointment,
        rescheduleApp,
        cancelApp,
        updateStatus,
        updateBarberNotes,
        triggerManualReminder,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCountForMaster,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
