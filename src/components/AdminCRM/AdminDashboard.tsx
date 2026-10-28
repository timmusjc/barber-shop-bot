import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppointmentStatus, ChannelType } from '../../types';
import { calculateStats } from '../../utils/bookingLogic';
import { BARBERSHOP_INFO } from '../../data/mockData';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Scissors, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Send, 
  Sparkles, 
  BarChart3, 
  Bot, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Key, 
  Server,
  Globe
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    appointments, 
    masters, 
    services, 
    updateStatus, 
    bookAppointment,
    triggerManualReminder,
    botKeys,
    updateBotKeys,
    testTelegramKey,
    testFacebookKey,
    currentLang,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'masters_services' | 'bot_settings' | 'ubuntu'>('overview');
  
  // Filters for Appointments
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMaster, setFilterMaster] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  // Manual Booking Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('+48 570 000 000');
  const [manualMasterId, setManualMasterId] = useState(masters[0]?.id || '');
  const [manualServiceId, setManualServiceId] = useState(services[0]?.id || '');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('14:00');
  const [manualChannel, setManualChannel] = useState<ChannelType>('telegram');

  // Webhook Simulator State
  const [webhookLog, setWebhookLog] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [keyTesting, setKeyTesting] = useState<'telegram' | 'facebook' | null>(null);
  const [keyTestFeedback, setKeyTestFeedback] = useState<string | null>(null);

  const stats = useMemo(() => calculateStats(appointments, masters, services), [appointments, masters, services]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredAppointments = appointments.filter(app => {
    if (filterMaster !== 'all' && app.masterId !== filterMaster) return false;
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterChannel !== 'all' && app.channel !== filterChannel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = app.clientName.toLowerCase().includes(q) ||
        app.clientPhone.toLowerCase().includes(q) ||
        app.bookingCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find(s => s.id === manualServiceId) || services[0];
    const res = bookAppointment({
      clientName: manualClientName,
      clientPhone: manualClientPhone,
      channel: manualChannel,
      language: currentLang,
      masterId: manualMasterId,
      serviceId: manualServiceId,
      date: manualDate,
      timeSlot: manualTime,
      price: service.price,
      notes: 'Utworzone przez administratora CRM',
    });

    if (res.success) {
      setShowManualModal(false);
      setManualClientName('');
    } else {
      alert(res.error || 'Błąd zapisu');
    }
  };

  const handleSimulateWebhook = (channel: ChannelType) => {
    const polishNames = ['Tomasz Adamczyk', 'Michał Dąbrowski', 'Krzysztof Kozłowski', 'Andrzej Wójcik'];
    const chosenName = polishNames[Math.floor(Math.random() * polishNames.length)];
    const chosenMaster = masters[Math.floor(Math.random() * masters.length)];
    const chosenService = services[Math.floor(Math.random() * services.length)];
    const todayStr = new Date().toISOString().split('T')[0];

    const res = bookAppointment({
      clientName: chosenName,
      clientPhone: `+48 ${Math.floor(500 + Math.random() * 499)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(100 + Math.random() * 899)}`,
      channel,
      language: currentLang,
      masterId: chosenMaster.id,
      serviceId: chosenService.id,
      date: todayStr,
      timeSlot: '17:00',
      price: chosenService.price,
      notes: `Webhook payload from ${channel.toUpperCase()}`,
    });

    if (res.success && res.appointment) {
      const logEntry = `[${new Date().toLocaleTimeString()}] HTTP 200 OK — Webhook ${channel.toUpperCase()}: Rezerwacja ${res.appointment.bookingCode} (${chosenName} dla ${chosenMaster.name})`;
      setWebhookLog(prev => [logEntry, ...prev.slice(0, 9)]);
    }
  };

  const handleTestTg = async () => {
    setKeyTesting('telegram');
    const res = await testTelegramKey();
    setKeyTestFeedback(res.message);
    setKeyTesting(null);
  };

  const handleTestFb = async () => {
    setKeyTesting('facebook');
    const res = await testFacebookKey();
    setKeyTestFeedback(res.message);
    setKeyTesting(null);
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 space-y-6">
      
      {/* Admin CRM Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-100">
                {t.adminTitle}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {t.adminSystemActive}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {t.adminSubtitle}
            </p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.adminTabOverview}
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.adminTabAppointments} ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('masters_services')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'masters_services'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.adminTabMasters}
          </button>
          <button
            onClick={() => setActiveTab('bot_settings')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'bot_settings'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.adminTabBots}
          </button>
          <button
            onClick={() => setActiveTab('ubuntu')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ubuntu'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>{t.adminTabUbuntu}</span>
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: OVERVIEW ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t.metricTotalRevenue}</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400">
                {stats.totalRevenue.toLocaleString()} {t.currency}
              </p>
              <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Aktywne rezerwacje
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t.metricTotalBookings}</span>
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-3xl font-black text-neutral-100">
                {stats.totalAppointments}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                Potwierdzone: <strong className="text-neutral-200">{stats.confirmedCount}</strong> • Odwołane: <strong className="text-red-400">{stats.cancelledCount}</strong>
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t.metricAverageCheck}</span>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-3xl font-black text-neutral-100">
                {stats.averageCheck.toLocaleString()} {t.currency}
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                Top barber: <strong className="text-amber-400">{stats.topMasterName}</strong>
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-semibold">{t.metricTeamLoad}</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400">
                {stats.masterOccupancyPercent}%
              </p>
              <p className="text-[11px] text-neutral-400 mt-2">
                {masters.length} barberów na zmianie
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <h3 className="font-black text-neutral-100 text-base mb-1 flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-400" />
                {t.chartMessengersTitle}
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                {t.chartMessengersDesc}
              </p>

              <div className="space-y-4">
                {[
                  { ch: 'telegram', label: 'Telegram Bot & Mini App', color: 'bg-sky-500', count: stats.channelBreakdown.telegram || 0 },
                  { ch: 'whatsapp', label: 'WhatsApp Business API', color: 'bg-emerald-500', count: stats.channelBreakdown.whatsapp || 0 },
                  { ch: 'instagram', label: 'Instagram Direct CRM', color: 'bg-pink-500', count: stats.channelBreakdown.instagram || 0 },
                  { ch: 'facebook', label: 'Facebook Messenger', color: 'bg-blue-500', count: stats.channelBreakdown.facebook || 0 },
                  { ch: 'web', label: 'Web Widget', color: 'bg-amber-500', count: stats.channelBreakdown.web || 0 },
                ].map(item => {
                  const percent = stats.totalAppointments > 0 
                    ? Math.round((item.count / stats.totalAppointments) * 100) 
                    : 0;
                  return (
                    <div key={item.ch}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300 font-semibold">{item.label}</span>
                        <span className="text-neutral-400 font-mono">{item.count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full transition-all duration-500`}
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
              <h3 className="font-black text-neutral-100 text-base mb-1 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                {t.teamPerformanceTitle}
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Ocena i suma wypracowana na zmianie
              </p>

              <div className="space-y-4">
                {masters.map(m => {
                  const masterApps = appointments.filter(a => a.masterId === m.id && a.status !== 'cancelled');
                  const masterRevenue = masterApps.reduce((s, a) => s + a.price, 0);

                  return (
                    <div key={m.id} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
                        />
                        <div>
                          <h4 className="font-bold text-neutral-200 text-xs sm:text-sm">
                            {m.name} ({m.nickname})
                          </h4>
                          <span className="text-[11px] text-neutral-400">
                            ⭐ {m.rating} • {m.role[currentLang] || m.role.pl}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-amber-400 text-sm block">
                          {masterRevenue.toLocaleString()} {t.currency}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {masterApps.length} wizyt
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: APPOINTMENTS ===================== */}
      {activeTab === 'appointments' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterMaster}
                onChange={e => setFilterMaster(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="all">Wszyscy mistrzowie</option>
                {masters.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="all">Wszystkie statusy</option>
                <option value="confirmed">Potwierdzona</option>
                <option value="in_progress">Na fotelu</option>
                <option value="completed">Zakończona</option>
                <option value="rescheduled">Przełożona</option>
                <option value="cancelled">Odwołana</option>
              </select>

              <select
                value={filterChannel}
                onChange={e => setFilterChannel(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="all">Wszystkie kanały</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="web">Web</option>
              </select>

              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>{t.btnManualBooking}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-bold tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Kod / Kanał</th>
                  <th className="py-3 px-4">Klient</th>
                  <th className="py-3 px-4">Usługa</th>
                  <th className="py-3 px-4">Barber</th>
                  <th className="py-3 px-4">Data i Czas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-neutral-500">
                      Brak rezerwacji o wybranych kryteriach
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => {
                    const master = masters.find(m => m.id === app.masterId);
                    const service = services.find(s => s.id === app.serviceId);
                    const sName = service?.name[currentLang] || service?.name.pl;

                    return (
                      <tr key={app.id} className="hover:bg-neutral-950/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-amber-400 block">
                            {app.bookingCode}
                          </span>
                          <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 inline-block mt-0.5">
                            {app.channel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-100 block">{app.clientName}</span>
                          <span className="text-[11px] text-neutral-400">{app.clientPhone}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-neutral-200 block">{sName}</span>
                          <span className="text-amber-400 font-bold">{app.price} {t.currency}</span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-neutral-300">
                          {master?.name}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-neutral-200 block">{app.date}</span>
                          <span className="text-amber-400 font-mono text-xs">{app.timeSlot}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as AppointmentStatus)}
                            className="bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2 py-1 font-semibold focus:outline-none"
                          >
                            <option value="confirmed">{t.statusConfirmed}</option>
                            <option value="in_progress">{t.statusInProgress}</option>
                            <option value="completed">{t.statusCompleted}</option>
                            <option value="rescheduled">{t.statusRescheduled}</option>
                            <option value="cancelled">{t.statusCancelled}</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => triggerManualReminder(app.id, 'reminder_2h')}
                              className="px-2 py-1 rounded bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              title="Wyślij przypomnienie 2h"
                            >
                              <Send className="w-3 h-3" />
                              <span>SMS / Bot</span>
                            </button>
                            <button
                              onClick={() => updateStatus(app.id, 'cancelled')}
                              disabled={app.status === 'cancelled'}
                              className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-semibold transition-colors disabled:opacity-30"
                              title="Odwołaj"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: MASTERS & SERVICES ===================== */}
      {activeTab === 'masters_services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-black text-neutral-100 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Zespół barberów ({masters.length})
            </h3>
            <div className="space-y-3">
              {masters.map(m => (
                <div key={m.id} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
                    />
                    <div>
                      <h4 className="font-bold text-neutral-100 text-sm">{m.name}</h4>
                      <p className="text-xs text-amber-400 font-medium">{m.role[currentLang] || m.role.pl} • {m.nickname}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{m.phone} • {m.workSchedule[currentLang] || m.workSchedule.pl}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Aktywny
                    </span>
                    <span className="block text-xs text-neutral-400 mt-1 font-bold">⭐ {m.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-black text-neutral-100 text-base flex items-center gap-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              Cennik i Usługi ({services.length})
            </h3>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {services.map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-neutral-200">{s.name[currentLang] || s.name.pl}</h4>
                    <span className="text-[11px] text-neutral-400">{s.category[currentLang] || s.category.pl} • {s.durationMinutes} min</span>
                  </div>
                  <span className="font-bold text-amber-400 text-sm">
                    {s.price} {t.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: BOT KEYS & API INTEGRATION ===================== */}
      {activeTab === 'bot_settings' && (
        <div className="space-y-6 animate-in fade-in">
          
          {keyTestFeedback && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <span>{keyTestFeedback}</span>
              <button onClick={() => setKeyTestFeedback(null)} className="font-bold hover:underline">
                OK
              </button>
            </div>
          )}

          {/* Connected Keys Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Telegram Bot Token Config */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-100 text-sm">Telegram Bot API</h4>
                    <span className="text-[11px] text-neutral-400">Powiadomienia i Mini App</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {botKeys.telegram.status === 'connected' ? 'Połączono' : 'Skonfiguruj'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Bot Token (z @BotFather):</label>
                  <input
                    type="password"
                    value={botKeys.telegram.botToken}
                    onChange={(e) => updateBotKeys({ telegram: { ...botKeys.telegram, botToken: e.target.value } })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Webhook URL:</label>
                  <input
                    type="text"
                    value={botKeys.telegram.webhookUrl}
                    onChange={(e) => updateBotKeys({ telegram: { ...botKeys.telegram, webhookUrl: e.target.value } })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-neutral-400">{botKeys.telegram.lastTested || 'Token zapisany'}</span>
                  <button
                    onClick={handleTestTg}
                    disabled={keyTesting === 'telegram'}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-colors"
                  >
                    {keyTesting === 'telegram' ? 'Sprawdzanie...' : 'Weryfikuj token Telegram'}
                  </button>
                </div>
              </div>
            </div>

            {/* Facebook Messenger & Instagram Direct */}
            <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-100 text-sm">Meta Graph API (FB &amp; IG)</h4>
                    <span className="text-[11px] text-neutral-400">Facebook Messenger &amp; Instagram Direct</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {botKeys.facebook.status === 'connected' ? 'Połączono' : 'Skonfiguruj'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Page Access Token (Meta for Developers):</label>
                  <input
                    type="password"
                    value={botKeys.facebook.pageAccessToken}
                    onChange={(e) => updateBotKeys({ facebook: { ...botKeys.facebook, pageAccessToken: e.target.value } })}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">Verify Token (Hub Secret):</label>
                    <input
                      type="text"
                      value={botKeys.facebook.verifyToken}
                      onChange={(e) => updateBotKeys({ facebook: { ...botKeys.facebook, verifyToken: e.target.value } })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-bold mb-1">App Secret:</label>
                    <input
                      type="password"
                      value={botKeys.facebook.appSecret}
                      onChange={(e) => updateBotKeys({ facebook: { ...botKeys.facebook, appSecret: e.target.value } })}
                      className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-neutral-400">{botKeys.facebook.lastTested || 'Token zapisany'}</span>
                  <button
                    onClick={handleTestFb}
                    disabled={keyTesting === 'facebook'}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-colors"
                  >
                    {keyTesting === 'facebook' ? 'Weryfikacja...' : 'Weryfikuj Meta API'}
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Webhook Simulator */}
          <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-neutral-100 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {t.webhookSimTitle}
                </h3>
                <p className="text-xs text-neutral-400">
                  {t.webhookSimDesc}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSimulateWebhook('telegram')}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-colors"
                >
                  {t.btnWebhookTelegram}
                </button>
                <button
                  onClick={() => handleSimulateWebhook('facebook')}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-colors"
                >
                  {t.btnWebhookFacebook}
                </button>
                <button
                  onClick={() => handleSimulateWebhook('whatsapp')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                >
                  {t.btnWebhookWhatsApp}
                </button>
                <button
                  onClick={() => handleSimulateWebhook('instagram')}
                  className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold transition-colors"
                >
                  {t.btnWebhookInstagram}
                </button>
              </div>
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-1.5">
              <span className="text-neutral-500 block text-[11px] uppercase tracking-wider mb-2">
                Live Webhook Ingestion Log:
              </span>
              {webhookLog.length === 0 ? (
                <p className="text-neutral-500 text-xs">
                  Gotowy do odbioru pakietów JSON z webhooków...
                </p>
              ) : (
                webhookLog.map((log, i) => (
                  <p key={i} className="text-emerald-400/90 leading-relaxed">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ===================== TAB 5: UBUNTU DEPLOYMENT GUIDE ===================== */}
      {activeTab === 'ubuntu' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/40">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-100">
                Kompletna instrukcja instalacji na serwerze Ubuntu (20.04 / 22.04 / 24.04 LTS)
              </h3>
              <p className="text-xs text-neutral-400">
                Krok po kroku: Node.js, PM2 daemon, Nginx Reverse Proxy, Let's Encrypt SSL i Webhooki
              </p>
            </div>
          </div>

          {/* Step 1: Packages */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Aktualizacja systemu i instalacja Node.js 20 LTS + PM2
            </h4>
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-200">
              <button
                onClick={() => copyToClipboard('sudo apt update && sudo apt upgrade -y\nsudo apt install -y curl git nginx certbot python3-certbot-nginx\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs\nsudo npm install -g pm2 tsx', 'step1')}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copiedCode === 'step1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kopiuj</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed">
{`sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 tsx`}
              </pre>
            </div>
          </div>

          {/* Step 2: Clone & Build */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">2</span>
              Klonowanie projektu i instalacja bibliotek
            </h4>
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-200">
              <button
                onClick={() => copyToClipboard('sudo mkdir -p /var/www/barber-bot\nsudo chown -R $USER:$USER /var/www/barber-bot\ncd /var/www/barber-bot\n# sklonuj lub wgraj pliki\nnpm install\nnpm run build', 'step2')}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copiedCode === 'step2' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kopiuj</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed">
{`sudo mkdir -p /var/www/barber-bot
sudo chown -R $USER:$USER /var/www/barber-bot
cd /var/www/barber-bot
npm install
npm run build`}
              </pre>
            </div>
          </div>

          {/* Step 3: PM2 daemon */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">3</span>
              Uruchomienie w tle przez PM2 (Auto-restart 24/7)
            </h4>
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-200">
              <button
                onClick={() => copyToClipboard('pm2 start server.ts --name "barber-bot" --interpreter tsx\npm2 save\npm2 startup', 'step3')}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copiedCode === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kopiuj</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed">
{`pm2 start server.ts --name "barber-bot" --interpreter tsx
pm2 save
pm2 startup`}
              </pre>
            </div>
          </div>

          {/* Step 4: Nginx & SSL */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">4</span>
              Konfiguracja Nginx i darmowy certyfikat HTTPS (Let's Encrypt)
            </h4>
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-200">
              <button
                onClick={() => copyToClipboard('sudo nano /etc/nginx/sites-available/barber-bot\n# Wklej konfigurację proxy na port 3000\nsudo ln -s /etc/nginx/sites-available/barber-bot /etc/nginx/sites-enabled/\nsudo nginx -t\nsudo systemctl reload nginx\nsudo certbot --nginx -d twoja-domena.pl', 'step4')}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copiedCode === 'step4' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kopiuj</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed">
{`server {
    server_name twoja-domena.pl;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Po zapisaniu wygeneruj SSL:
sudo certbot --nginx -d twoja-domena.pl`}
              </pre>
            </div>
          </div>

          {/* Step 5: Webhook registration */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">5</span>
              Połączenie Webhooków Telegram i Meta
            </h4>
            <div className="relative bg-neutral-950 p-4 rounded-2xl border border-neutral-800 font-mono text-xs text-neutral-200">
              <button
                onClick={() => copyToClipboard('curl -F "url=https://twoja-domena.pl/api/webhook/telegram" https://api.telegram.org/bot<TOKEN>/setWebhook', 'step5')}
                className="absolute top-3 right-3 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copiedCode === 'step5' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Kopiuj</span>
              </button>
              <pre className="whitespace-pre-wrap leading-relaxed">
{`# 1. Telegram:
curl -F "url=https://twoja-domena.pl/api/webhook/telegram" https://api.telegram.org/bot<TOKEN>/setWebhook

# 2. Meta (Facebook & Instagram):
# Panel developers.facebook.com -> Webhooks -> Messenger:
# Callback URL: https://twoja-domena.pl/api/webhook/facebook
# Verify Token: blade_crown_barber_secret_token (z pliku .env)`}
              </pre>
            </div>
          </div>

        </div>
      )}

      {/* Manual Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-neutral-100 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                {t.btnManualBooking}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">{t.labelName}</label>
                <input
                  type="text"
                  required
                  value={manualClientName}
                  onChange={e => setManualClientName(e.target.value)}
                  placeholder="Krzysztof Kowalczyk"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">{t.labelPhone}</label>
                <input
                  type="tel"
                  required
                  value={manualClientPhone}
                  onChange={e => setManualClientPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">{t.stepBarber}</label>
                  <select
                    value={manualMasterId}
                    onChange={e => setManualMasterId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl"
                  >
                    {masters.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">{t.stepService}</label>
                  <select
                    value={manualServiceId}
                    onChange={e => setManualServiceId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name[currentLang] || s.name.pl} ({s.price} {t.currency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">{t.labelDate}</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Godzina</label>
                  <input
                    type="text"
                    value={manualTime}
                    onChange={e => setManualTime(e.target.value)}
                    placeholder="14:00"
                    className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">Kanał</label>
                <select
                  value={manualChannel}
                  onChange={e => setManualChannel(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-100 p-2.5 rounded-xl"
                >
                  <option value="telegram">Telegram Bot</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="web">Recepcja / Telefon</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                >
                  {t.btnCancelAction}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                >
                  {t.btnFinishBooking}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
