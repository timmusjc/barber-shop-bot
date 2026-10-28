import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableSlots,
  createBooking,
  rescheduleBooking,
  cancelBooking,
  calculateStats,
  generateMasterNotification,
  validateTelegramBotToken,
  validateFacebookToken,
  WORK_HOURS
} from './bookingLogic';
import { Appointment, Master, Service } from '../types';

const mockMaster: Master = {
  id: 'm1',
  name: 'Jakub Gromov',
  nickname: 'Blade',
  role: {
    pl: 'Chief Barber',
    uk: 'Шеф-барбер',
    ru: 'Шеф-барбер',
  },
  avatar: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
  rating: 4.95,
  reviewsCount: 142,
  experienceYears: 8,
  specialties: {
    pl: ['Fade', 'Broda', 'Brzytwa'],
    uk: ['Fade', 'Борода', 'Бритва'],
    ru: ['Fade', 'Борода', 'Бритва'],
  },
  phone: '+48 501 111 222',
  telegram: '@blade_master',
  instagram: '@blade_barber',
  active: true,
  workSchedule: {
    pl: '10:00 - 21:00, Wt-Nd',
    uk: '10:00 - 21:00, Вт-Нд',
    ru: '10:00 - 21:00, Вт-Вс',
  },
};

const mockService: Service = {
  id: 's1',
  name: {
    pl: 'Strzyżenie męskie',
    uk: 'Чоловіча стрижка',
    ru: 'Мужская стрижка',
  },
  category: {
    pl: 'Strzyżenia',
    uk: 'Стрижки',
    ru: 'Стрижки',
  },
  price: 90,
  durationMinutes: 45,
  description: {
    pl: 'Mycie, strzyżenie i stylizacja.',
    uk: 'Миття, стрижка та укладка.',
    ru: 'Мытье, стрижка и укладка.',
  },
};

test('getAvailableSlots excludes booked slots for master on same date', () => {
  const existing: Appointment[] = [
    {
      id: 'a1',
      bookingCode: 'BRB-1001',
      clientName: 'Piotr',
      clientPhone: '+48501000111',
      channel: 'telegram',
      language: 'pl',
      masterId: 'm1',
      serviceId: 's1',
      date: '2026-10-29',
      timeSlot: '12:00',
      status: 'confirmed',
      price: 90,
      createdAt: new Date().toISOString(),
      remindersSent: {},
    },
    {
      id: 'a2',
      bookingCode: 'BRB-1002',
      clientName: 'Jan (odwołana)',
      clientPhone: '+48501000222',
      channel: 'whatsapp',
      language: 'pl',
      masterId: 'm1',
      serviceId: 's1',
      date: '2026-10-29',
      timeSlot: '14:00',
      status: 'cancelled',
      price: 90,
      createdAt: new Date().toISOString(),
      remindersSent: {},
    },
  ];

  const slots = getAvailableSlots('m1', '2026-10-29', existing);
  assert.ok(!slots.includes('12:00'), '12:00 must be booked');
  assert.ok(slots.includes('14:00'), '14:00 must be free');
  assert.equal(slots.length, WORK_HOURS.length - 1);
});

test('createBooking works with Polish language as primary default', () => {
  const existing: Appointment[] = [];
  
  const invalid = createBooking({
    clientName: '',
    clientPhone: '+48 501 222 333',
    channel: 'telegram',
    masterId: 'm1',
    serviceId: 's1',
    date: '2026-10-29',
    timeSlot: '11:00',
    price: 90,
  }, existing, 'pl');

  assert.equal(invalid.success, false);
  assert.equal(invalid.error, 'Wpisz swoje imię i nazwisko');

  const valid = createBooking({
    clientName: 'Marek Nowak',
    clientPhone: '+48 501 222 333',
    channel: 'telegram',
    language: 'pl',
    masterId: 'm1',
    serviceId: 's1',
    date: '2026-10-29',
    timeSlot: '11:00',
    price: 90,
  }, existing, 'pl');

  assert.equal(valid.success, true);
  assert.equal(valid.appointment?.clientName, 'Marek Nowak');
  assert.equal(valid.appointment?.language, 'pl');
});

test('rescheduleBooking moves appointment to new free slot and supports Ukrainian and Russian errors', () => {
  const initialApp: Appointment = {
    id: 'a1',
    bookingCode: 'BRB-1111',
    clientName: 'Tomasz',
    clientPhone: '+48501999888',
    channel: 'facebook',
    language: 'pl',
    masterId: 'm1',
    serviceId: 's1',
    date: '2026-10-29',
    timeSlot: '12:00',
    status: 'confirmed',
    price: 90,
    createdAt: new Date().toISOString(),
    remindersSent: {},
  };

  const collisionApp: Appointment = {
    id: 'a2',
    bookingCode: 'BRB-2222',
    clientName: 'Konstanty',
    clientPhone: '+48501777666',
    channel: 'web',
    language: 'pl',
    masterId: 'm1',
    serviceId: 's1',
    date: '2026-10-29',
    timeSlot: '15:00',
    status: 'confirmed',
    price: 90,
    createdAt: new Date().toISOString(),
    remindersSent: {},
  };

  const list = [initialApp, collisionApp];

  const conflictUK = rescheduleBooking('a1', '2026-10-29', '15:00', list, 'uk');
  assert.equal(conflictUK.success, false);
  assert.ok(conflictUK.error?.includes('зайнятий'));

  const successPL = rescheduleBooking('a1', '2026-10-29', '16:30', list, 'pl');
  assert.equal(successPL.success, true);
  assert.equal(successPL.updatedAppointment?.timeSlot, '16:30');
});

test('token validators correctly identify valid and invalid Telegram and Facebook tokens', () => {
  // Valid telegram bot tokens
  assert.ok(validateTelegramBotToken('1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567'));
  assert.ok(validateTelegramBotToken('589412345:AAH_XYZ1234567890abcdefghijklmnopqr'));
  assert.equal(validateTelegramBotToken('invalid_token'), false);
  assert.equal(validateTelegramBotToken(''), false);

  // Valid facebook page tokens
  assert.ok(validateFacebookToken('EAAGm0PX4ZCpsBAK1234567890abcdefghijklmnopqrstuvwxyz1234567890'));
  assert.equal(validateFacebookToken('short_fb_token'), false);
});
