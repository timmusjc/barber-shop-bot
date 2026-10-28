import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Master, Service, Appointment } from '../../types';
import { getAvailableSlots } from '../../utils/bookingLogic';
import { BARBERSHOP_INFO } from '../../data/mockData';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  XCircle, 
  AlertTriangle,
  History,
  Check,
  Globe
} from 'lucide-react';

export const ClientWebApp: React.FC = () => {
  const { 
    services, 
    masters, 
    appointments, 
    bookAppointment, 
    rescheduleApp, 
    cancelApp,
    clientPhone,
    setClientPhone,
    clientName,
    setClientName,
    currentLang,
    setLanguage,
    t
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'book' | 'profile'>('book');

  // Booking Wizard States
  const [step, setStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(services[0]);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(masters[0]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [clientComment, setClientComment] = useState<string>('');
  const [bookingChannel, setBookingChannel] = useState<'telegram' | 'whatsapp' | 'instagram' | 'facebook' | 'web'>('telegram');
  const [confirmedApp, setConfirmedApp] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string>('');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState<string>('');
  const [newRescheduleSlot, setNewRescheduleSlot] = useState<string>('');
  const [rescheduleError, setRescheduleError] = useState<string>('');

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  // Generate next 14 days
  const locale = currentLang === 'pl' ? 'pl-PL' : currentLang === 'uk' ? 'uk-UA' : 'ru-RU';
  const dateOptions = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(locale, { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString(locale, { month: 'short' });
    return { dateStr, dayName, dayNumber, monthName, isToday: i === 0 };
  });

  const availableSlots = selectedMaster && selectedDate
    ? getAvailableSlots(selectedMaster.id, selectedDate, appointments)
    : [];

  const myAppointments = appointments.filter(
    a => a.clientPhone === clientPhone || a.clientName.toLowerCase() === clientName.toLowerCase()
  );

  const activeAppointments = myAppointments.filter(a => a.status === 'confirmed' || a.status === 'rescheduled');
  const pastAppointments = myAppointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const categories = [
    { id: 'all', label: currentLang === 'pl' ? 'Wszystkie' : currentLang === 'uk' ? 'Усі' : 'Все' },
    { id: 'hair', label: currentLang === 'pl' ? 'Strzyżenia' : currentLang === 'uk' ? 'Стрижки' : 'Стрижки' },
    { id: 'beard', label: currentLang === 'pl' ? 'Broda i golenie' : currentLang === 'uk' ? 'Борода і гоління' : 'Борода и бритье' },
    { id: 'combo', label: currentLang === 'pl' ? 'Pakiety' : currentLang === 'uk' ? 'Комплекси' : 'Комплексы' },
    { id: 'spa', label: currentLang === 'pl' ? 'SPA i Pielęgnacja' : currentLang === 'uk' ? 'Догляд і SPA' : 'Уход и SPA' },
  ];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter(s => {
        const cat = s.category.pl;
        if (selectedCategory === 'hair') return cat === 'Strzyżenia';
        if (selectedCategory === 'beard') return cat === 'Broda i golenie';
        if (selectedCategory === 'combo') return cat === 'Pakiety';
        if (selectedCategory === 'spa') return cat === 'SPA i Pielęgnacja';
        return true;
      });

  const handleFinishBooking = () => {
    if (!selectedService || !selectedMaster || !selectedDate || !selectedSlot) {
      setBookingError(currentLang === 'pl' ? 'Wypełnij wszystkie pola' : 'Заповніть усі поля');
      return;
    }

    setBookingError('');
    const res = bookAppointment({
      clientName,
      clientPhone,
      clientHandle: bookingChannel === 'telegram' ? '@jan_zielinski' : undefined,
      channel: bookingChannel,
      language: currentLang,
      masterId: selectedMaster.id,
      serviceId: selectedService.id,
      date: selectedDate,
      timeSlot: selectedSlot,
      price: selectedService.price,
      notes: clientComment,
    });

    if (res.success && res.appointment) {
      setConfirmedApp(res.appointment);
      setStep(5);
    } else {
      setBookingError(res.error || 'Błąd rezerwacji');
    }
  };

  const handleOpenReschedule = (app: Appointment) => {
    setRescheduleTarget(app);
    setNewRescheduleDate(app.date);
    setNewRescheduleSlot('');
    setRescheduleError('');
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTarget || !newRescheduleDate || !newRescheduleSlot) {
      setRescheduleError(currentLang === 'pl' ? 'Wybierz datę i wolną godzinę' : 'Оберіть дату і час');
      return;
    }

    const res = rescheduleApp(rescheduleTarget.id, newRescheduleDate, newRescheduleSlot);
    if (res.success) {
      setRescheduleTarget(null);
    } else {
      setRescheduleError(res.error || 'Błąd');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    cancelApp(cancelTarget.id);
    setCancelTarget(null);
  };

  return (
    <div className="py-6 max-w-5xl mx-auto px-4">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-neutral-900 border border-neutral-800 p-3 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-100">
              {t.webAppTitle}
            </h2>
            <p className="text-xs text-neutral-400">
              {t.webAppSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveSubTab('book')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'book'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.tabNewBooking}
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'profile'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.tabProfile}
            {activeAppointments.length > 0 && (
              <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-black">
                {activeAppointments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===================== VIEW 1: BOOKING WIZARD ===================== */}
      {activeSubTab === 'book' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-8 shadow-2xl">
          {step < 5 && (
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-2xl mx-auto mb-4">
                {[
                  { num: 1, label: t.stepService },
                  { num: 2, label: t.stepBarber },
                  { num: 3, label: t.stepDateTime },
                  { num: 4, label: t.stepContacts },
                ].map(s => (
                  <div key={s.num} className="flex flex-col items-center">
                    <button
                      onClick={() => s.num < step && setStep(s.num)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        step === s.num
                          ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20'
                          : step > s.num
                          ? 'bg-neutral-800 text-amber-400 border border-amber-500/40 cursor-pointer'
                          : 'bg-neutral-950 text-neutral-500 border border-neutral-800 cursor-not-allowed'
                      }`}
                    >
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </button>
                    <span className="text-[11px] font-medium text-neutral-400 mt-1.5 hidden sm:inline">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-neutral-100">
                    {t.step1Title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {t.step1Desc}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredServices.map(s => {
                  const isSelected = selectedService?.id === s.id;
                  const sName = s.name[currentLang] || s.name.pl;
                  const sDesc = s.description[currentLang] || s.description.pl;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-neutral-100 text-sm sm:text-base">
                            {sName}
                          </h4>
                          {s.popular && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0">
                              {t.topChoice}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                          {sDesc}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-500" />
                          {s.durationMinutes} {t.durationMin}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-amber-400 text-base">
                            {s.price} {t.currency}
                          </span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  <span>{t.btnNextBarber}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Master */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-neutral-100">
                  {t.step2Title}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t.step2Desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {masters.map(m => {
                  const isSelected = selectedMaster?.id === m.id;
                  const role = m.role[currentLang] || m.role.pl;
                  const specs = (m.specialties[currentLang] || m.specialties.pl).join(', ');

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMaster(m)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-center relative ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 shadow-lg'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}

                      <div>
                        <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-2 border-neutral-700 shadow-md">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-bold text-neutral-100 text-sm">
                          {m.name}
                        </h4>
                        <p className="text-xs text-amber-400 font-medium">
                          {m.nickname} • {role}
                        </p>

                        <div className="flex items-center justify-center gap-1 text-xs text-neutral-300 mt-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-bold">{m.rating}</span>
                          <span className="text-neutral-500 text-[11px]">({m.reviewsCount})</span>
                        </div>

                        <p className="text-[11px] text-neutral-400 mt-2">
                          {t.experienceYears(m.experienceYears)}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                        <span className="line-clamp-1">{specs}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Wstecz</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedMaster}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  <span>{t.btnNextTime}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Date & Time Slot */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-neutral-100">
                  {t.step3Title}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t.step3Desc}: {selectedMaster?.name} ({selectedMaster?.nickname})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wider">
                  {t.labelDate}
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {dateOptions.map(d => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setSelectedSlot('');
                        }}
                        className={`flex flex-col items-center justify-center min-w-[70px] py-2.5 px-3 rounded-2xl border transition-all shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 font-black border-amber-500 shadow-md scale-105'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold opacity-80">
                          {d.isToday ? (currentLang === 'pl' ? 'Dziś' : 'Сьогодні') : d.dayName}
                        </span>
                        <span className="text-lg font-black my-0.5">
                          {d.dayNumber}
                        </span>
                        <span className="text-[10px] opacity-80">
                          {d.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2 uppercase tracking-wider">
                  {t.labelAvailableHours(selectedDate)}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center text-neutral-400 text-xs">
                    {t.botNoSlots(selectedDate)}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {availableSlots.map(slot => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                            isSelected
                              ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md scale-105'
                              : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-amber-500/40'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Wstecz</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedSlot}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40"
                >
                  <span>{t.btnNextContacts}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Contact Details & Channel */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-black text-neutral-100">
                  {t.step4Title}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t.step4Desc}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{t.stepService}:</span>
                  <span className="font-bold text-neutral-200">
                    {selectedService?.name[currentLang] || selectedService?.name.pl} ({selectedService?.price} {t.currency})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{t.stepBarber}:</span>
                  <span className="font-bold text-neutral-200">{selectedMaster?.name} ({selectedMaster?.nickname})</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{t.stepDateTime}:</span>
                  <span className="font-bold text-amber-400">{selectedDate} o {selectedSlot}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Adres:</span>
                  <span className="text-neutral-300">{BARBERSHOP_INFO.address[currentLang] || BARBERSHOP_INFO.address.pl}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    {t.labelName}
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Jan Zieliński"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    {t.labelPhone}
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+48 570 111 222"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    {t.labelChannel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'telegram', label: 'Telegram Bot' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'instagram', label: 'Instagram' },
                      { id: 'facebook', label: 'Messenger' },
                    ].map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setBookingChannel(ch.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          bookingChannel === ch.id
                            ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    {t.labelNotes}
                  </label>
                  <input
                    type="text"
                    value={clientComment}
                    onChange={e => setClientComment(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Wstecz</span>
                </button>
                <button
                  onClick={handleFinishBooking}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <span>{t.btnFinishBooking}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success Screen */}
          {step === 5 && confirmedApp && (
            <div className="text-center py-6 max-w-lg mx-auto space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-neutral-100">
                  {t.bookingSuccessTitle}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {t.bookingSuccessDesc(confirmedApp.channel)}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <span className="text-xs text-neutral-400">{t.bookingCodeLabel}</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{confirmedApp.bookingCode}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>{t.stepService}:</span>
                  <span className="font-bold">{selectedService?.name[currentLang] || selectedService?.name.pl}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>{t.stepBarber}:</span>
                  <span className="font-bold">{selectedMaster?.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>{t.stepDateTime}:</span>
                  <span className="font-bold text-amber-400">{confirmedApp.date} o {confirmedApp.timeSlot}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Cena:</span>
                  <span className="font-bold">{confirmedApp.price} {t.currency}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => setActiveSubTab('profile')}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>{t.btnGoToVisits}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedSlot('');
                    setConfirmedApp(null);
                  }}
                  className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs sm:text-sm"
                >
                  {t.btnBookAnother}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== VIEW 2: CLIENT PROFILE & VISITS ===================== */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-neutral-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h3 className="text-lg font-black text-neutral-100">{clientName}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    VIP GUEST
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  {clientPhone}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {t.clientDiscount} {myAppointments.length}
                </p>
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-xs w-full sm:w-auto">
              <span className="text-neutral-400 block mb-1">
                {currentLang === 'pl' ? 'Konto klienta demo:' : 'Тестовий профіль:'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setClientName('Jan Zieliński');
                    setClientPhone('+48 570 111 222');
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px]"
                >
                  Jan (PL)
                </button>
                <button
                  onClick={() => {
                    setClientName('Piotr Wiśniewski');
                    setClientPhone('+48 601 234 567');
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px]"
                >
                  Piotr (PL)
                </button>
                <button
                  onClick={() => {
                    setClientName('Ołeksandr Melnyk');
                    setClientPhone('+48 799 112 233');
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px]"
                >
                  Олександр (UA)
                </button>
              </div>
            </div>
          </div>

          {/* Active Appointments */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h3 className="font-black text-neutral-100 text-base mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              {t.activeBookingsTitle(activeAppointments.length)}
            </h3>

            {activeAppointments.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/60 rounded-2xl border border-neutral-800/80">
                <p className="text-sm text-neutral-400">{t.noActiveBookings}</p>
                <button
                  onClick={() => setActiveSubTab('book')}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  {t.tabNewBooking}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAppointments.map(app => {
                  const master = masters.find(m => m.id === app.masterId);
                  const service = services.find(s => s.id === app.serviceId);
                  const sName = service?.name[currentLang] || service?.name.pl;
                  const statusLabel = app.status === 'rescheduled' ? t.statusRescheduled : t.statusConfirmed;

                  return (
                    <div
                      key={app.id}
                      className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-md flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-mono text-xs text-amber-400 font-bold">
                              {app.bookingCode}
                            </span>
                            <h4 className="text-base font-black text-neutral-100 mt-0.5">
                              {sName}
                            </h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            app.status === 'rescheduled'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-neutral-300">
                          <p className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-neutral-100">{app.date} o {app.timeSlot}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Barber: <strong className="text-neutral-200">{master?.name}</strong> ({master?.nickname})</span>
                          </p>
                          <p className="text-neutral-400 text-[11px]">
                            {app.channel.toUpperCase()} • {app.price} {t.currency}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenReschedule(app)}
                          className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>{t.btnRescheduleVisit}</span>
                        </button>
                        <button
                          onClick={() => setCancelTarget(app)}
                          className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-500/30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t.btnCancelVisit}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <h3 className="font-bold text-neutral-300 text-sm mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-500" />
                {t.visitHistoryTitle(pastAppointments.length)}
              </h3>
              <div className="space-y-2.5">
                {pastAppointments.map(app => {
                  const master = masters.find(m => m.id === app.masterId);
                  const service = services.find(s => s.id === app.serviceId);
                  const sName = service?.name[currentLang] || service?.name.pl;
                  return (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-neutral-200">{sName}</span>
                        <p className="text-neutral-500 text-[11px] mt-0.5">
                          {app.date} o {app.timeSlot} • Barber: {master?.name}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'completed'
                          ? 'bg-neutral-800 text-neutral-300'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {app.status === 'completed' ? t.statusCompleted : t.statusCancelled}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== RESCHEDULE MODAL ===================== */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-neutral-100 text-base flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                {t.modalRescheduleTitle(rescheduleTarget.bookingCode)}
              </h3>
              <button
                onClick={() => setRescheduleTarget(null)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              {t.modalRescheduleDesc}
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                {t.labelDate}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {dateOptions.slice(0, 7).map(d => (
                  <button
                    key={d.dateStr}
                    onClick={() => {
                      setNewRescheduleDate(d.dateStr);
                      setNewRescheduleSlot('');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold shrink-0 ${
                      newRescheduleDate === d.dateStr
                        ? 'bg-amber-500 text-neutral-950 border-amber-500'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                    }`}
                  >
                    {d.dayName}, {d.dayNumber}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                {t.labelAvailableHours(newRescheduleDate)}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {getAvailableSlots(rescheduleTarget.masterId, newRescheduleDate, appointments, rescheduleTarget.id)
                  .slice(0, 12)
                  .map(slot => (
                    <button
                      key={slot}
                      onClick={() => setNewRescheduleSlot(slot)}
                      className={`py-2 rounded-lg text-xs font-bold border ${
                        newRescheduleSlot === slot
                          ? 'bg-amber-500 text-neutral-950 border-amber-500'
                          : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
              </div>
            </div>

            {rescheduleError && (
              <p className="text-xs text-red-400">{rescheduleError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                {t.btnCancelAction}
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!newRescheduleSlot}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs disabled:opacity-40"
              >
                {t.btnConfirmReschedule}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CANCEL MODAL ===================== */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-neutral-100 text-base">
                {t.modalCancelTitle(cancelTarget.bookingCode)}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {t.modalCancelDesc}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold"
              >
                {t.btnKeepVisit}
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                {t.btnConfirmCancel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
