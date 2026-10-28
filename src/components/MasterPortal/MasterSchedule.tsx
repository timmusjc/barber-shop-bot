import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppointmentStatus } from '../../types';
import { 
  Calendar, 
  Phone, 
  FileText, 
  Sparkles, 
  Scissors
} from 'lucide-react';

export const MasterSchedule: React.FC = () => {
  const { 
    masters, 
    selectedMasterId, 
    setSelectedMasterId, 
    appointments, 
    services, 
    updateStatus, 
    updateBarberNotes, 
    notifications,
    markNotificationRead,
    currentLang,
    t
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [editingNotesAppId, setEditingNotesAppId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const currentMaster = masters.find(m => m.id === selectedMasterId) || masters[0];

  const masterNotifs = notifications.filter(
    n => n.recipientType === 'master' && n.recipientId === currentMaster.id
  );
  const unreadNotifs = masterNotifs.filter(n => !n.read);

  const masterAppsForDay = appointments.filter(
    a => a.masterId === currentMaster.id && a.date === selectedDate
  ).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const validApps = masterAppsForDay.filter(a => a.status !== 'cancelled');
  const dayRevenue = validApps.reduce((sum, a) => sum + a.price, 0);

  const handleSaveNotes = (appId: string) => {
    updateBarberNotes(appId, tempNotes);
    setEditingNotesAppId(null);
  };

  const statusLabels: Record<AppointmentStatus, { text: string; bg: string }> = {
    confirmed: { text: t.statusConfirmed, bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    in_progress: { text: t.statusInProgress, bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' },
    completed: { text: t.statusCompleted, bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    cancelled: { text: t.statusCancelled, bg: 'bg-red-500/20 text-red-400 border-red-500/30' },
    rescheduled: { text: t.statusRescheduled, bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4 space-y-6">
      
      {/* Top Banner: Master Info & Live Alerts */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentMaster.avatar}
                alt={currentMaster.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-neutral-100">{currentMaster.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {currentMaster.role[currentLang] || currentMaster.role.pl}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentMaster.nickname} • {currentMaster.workSchedule[currentLang] || currentMaster.workSchedule.pl}
              </p>
            </div>
          </div>

          {/* Master Switcher */}
          <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-2xl border border-neutral-800 text-xs w-full md:w-auto">
            <span className="text-neutral-400 pl-2">{t.barber}</span>
            <select
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs focus:outline-none cursor-pointer"
            >
              {masters.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.nickname})
                </option>
              ))}
            </select>
          </div>
        </div>

        {unreadNotifs.length > 0 && (
          <div className="mt-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{t.masterNewAlerts(unreadNotifs.length)}</strong> {unreadNotifs[0].message}
              </span>
            </div>
            <button
              onClick={() => unreadNotifs.forEach(n => markNotificationRead(n.id))}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline shrink-0"
            >
              {t.btnMarkRead}
            </button>
          </div>
        )}
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400">{t.masterMetricBookings}</span>
          <p className="text-2xl font-black text-neutral-100 mt-1">{validApps.length}</p>
          <span className="text-[11px] text-neutral-500">Max 10</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400">{t.masterMetricRevenue}</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{dayRevenue.toLocaleString()} {t.currency}</p>
          <span className="text-[11px] text-emerald-400 font-medium">Kasa</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400">{t.masterMetricOccupancy}</span>
          <p className="text-2xl font-black text-neutral-100 mt-1">
            {Math.min(100, Math.round((validApps.length / 8) * 100))}%
          </p>
          <span className="text-[11px] text-neutral-500">Norma: 8</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg">
          <span className="text-xs text-neutral-400">{t.masterMetricRating}</span>
          <p className="text-2xl font-black text-amber-400 mt-1">⭐ {currentMaster.rating}</p>
          <span className="text-[11px] text-neutral-500">{currentMaster.reviewsCount} opinii</span>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-neutral-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              {t.masterScheduleTitle}
            </h3>
            <p className="text-xs text-neutral-400">
              {t.masterScheduleDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">{t.labelDate}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-100 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {masterAppsForDay.length === 0 ? (
          <div className="py-12 text-center bg-neutral-950/50 rounded-2xl border border-neutral-800/80">
            <p className="text-neutral-400 text-sm">Brak wizyt na wybrany dzień</p>
            <p className="text-neutral-500 text-xs mt-1">Wszystkie terminy są wolne w botach</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {masterAppsForDay.map(app => {
              const service = services.find(s => s.id === app.serviceId);
              const sName = service?.name[currentLang] || service?.name.pl;
              const statusCfg = statusLabels[app.status];
              const isCancelled = app.status === 'cancelled';

              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCancelled
                      ? 'bg-neutral-950/30 border-neutral-800/50 opacity-60'
                      : app.status === 'in_progress'
                      ? 'bg-neutral-950 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center shrink-0">
                        <span className="font-mono text-base font-black text-amber-400 block">
                          {app.timeSlot}
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          {service?.durationMinutes} min
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-neutral-100 text-sm sm:text-base">
                            {app.clientName}
                          </h4>
                          <span className="text-xs text-neutral-400 font-mono">
                            ({app.bookingCode})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${statusCfg.bg}`}>
                            {statusCfg.text}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                          <span className="text-neutral-200 font-semibold">{sName}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">{app.price} {t.currency}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Phone className="w-3 h-3" />
                            {app.clientPhone}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-bold">
                            {app.channel}
                          </span>
                        </div>

                        {app.notes && (
                          <p className="text-xs text-neutral-400 mt-1 italic">
                            "{app.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => updateStatus(app.id, 'in_progress')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            app.status === 'in_progress'
                              ? 'bg-amber-500 text-neutral-950 font-black'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800'
                          }`}
                        >
                          {t.btnChair}
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'completed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            app.status === 'completed'
                              ? 'bg-emerald-500 text-neutral-950 font-black'
                              : 'bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800'
                          }`}
                        >
                          {t.btnComplete}
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotesAppId(app.id);
                            setTempNotes(app.barberNotes || '');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{t.btnNote}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {(app.barberNotes || editingNotesAppId === app.id) && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/80">
                      {editingNotesAppId === app.id ? (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-neutral-400 block">
                            {t.masterNoteLabel}
                          </label>
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Fade 1.5mm, kawa bez cukru..."
                            rows={2}
                            className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 p-2 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingNotesAppId(null)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                            >
                              {t.btnCancelAction}
                            </button>
                            <button
                              onClick={() => handleSaveNotes(app.id)}
                              className="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs"
                            >
                              {t.btnSaveNote}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60 flex items-start gap-2 text-xs text-neutral-300">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Notatka:</strong> {app.barberNotes}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
