export type ChannelType = 'telegram' | 'whatsapp' | 'instagram' | 'facebook';

export type Language = 'pl' | 'uk' | 'ru';

export type AppointmentStatus = 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'rescheduled';

export interface Master {
  id: string;
  name: string;
  nickname: string;
  role: {
    pl: string;
    uk: string;
    ru: string;
  };
  avatar: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  specialties: {
    pl: string[];
    uk: string[];
    ru: string[];
  };
  phone: string;
  telegram: string;
  instagram: string;
  active: boolean;
  workSchedule: {
    pl: string;
    uk: string;
    ru: string;
  };
}

export interface Service {
  id: string;
  name: {
    pl: string;
    uk: string;
    ru: string;
  };
  category: {
    pl: string;
    uk: string;
    ru: string;
  };
  price: number;
  durationMinutes: number;
  description: {
    pl: string;
    uk: string;
    ru: string;
  };
  popular?: boolean;
}

export interface Appointment {
  id: string;
  bookingCode: string; // e.g. BRB-4821
  clientName: string;
  clientPhone: string;
  clientHandle?: string;
  channel: ChannelType | 'web';
  language?: Language;
  masterId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: AppointmentStatus;
  notes?: string;
  barberNotes?: string;
  price: number;
  createdAt: string;
  remindersSent: {
    dayBefore?: boolean;
    hoursBefore?: boolean;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: string;
  channel: ChannelType;
  language?: Language;
  options?: string[];
  actionType?: 'open_webapp' | 'select_service' | 'select_master' | 'select_date' | 'select_time' | 'cancel_or_reschedule' | 'contact_admin' | 'switch_lang';
  appointmentData?: Partial<Appointment>;
}

export interface NotificationItem {
  id: string;
  recipientType: 'master' | 'client' | 'admin';
  recipientId?: string; // masterId or clientPhone
  recipientName: string;
  channel: ChannelType | 'sms' | 'push';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  appointmentId?: string;
  type: 'new_booking' | 'rescheduled' | 'cancelled' | 'reminder_24h' | 'reminder_2h' | 'status_changed';
}

export interface BarbershopInfo {
  name: string;
  tagline: {
    pl: string;
    uk: string;
    ru: string;
  };
  address: {
    pl: string;
    uk: string;
    ru: string;
  };
  phone: string;
  telegramBot: string;
  instagram: string;
  whatsapp: string;
  facebookPage: string;
  workHours: {
    pl: string;
    uk: string;
    ru: string;
  };
}

export interface BotApiKeysConfig {
  telegram: {
    botToken: string;
    webhookUrl: string;
    botUsername: string;
    isActive: boolean;
    lastTested?: string;
    status: 'connected' | 'unconfigured' | 'error';
  };
  facebook: {
    pageAccessToken: string;
    verifyToken: string;
    appSecret: string;
    pageId: string;
    webhookUrl: string;
    isActive: boolean;
    lastTested?: string;
    status: 'connected' | 'unconfigured' | 'error';
  };
  whatsapp: {
    phoneNumberId: string;
    accessToken: string;
    isActive: boolean;
    status: 'connected' | 'unconfigured' | 'error';
  };
  instagram: {
    igUserId: string;
    accessToken: string;
    isActive: boolean;
    status: 'connected' | 'unconfigured' | 'error';
  };
}
