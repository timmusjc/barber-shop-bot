import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Send, 
  Clock, 
  UserCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';

export const NotificationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    triggerManualReminder,
    appointments,
    t
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'master' | 'client'>('all');
  const [selectedAppId, setSelectedAppId] = useState<string>(appointments[0]?.id || '');

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'master') return n.recipientType === 'master';
    if (filter === 'client') return n.recipientType === 'client';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-100 text-base">
                {t.notifLogTitle}
              </h3>
              <p className="text-xs text-neutral-400">
                {t.notifLogDesc}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-neutral-400 hover:text-amber-400 px-2.5 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t.btnMarkAllRead}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Simulator Bar */}
        <div className="p-3.5 bg-neutral-950 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-medium">{t.autoReminderTest}</span>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-neutral-200 px-2 py-1 rounded text-xs focus:outline-none"
            >
              {appointments.slice(0, 5).map(app => (
                <option key={app.id} value={app.id}>
                  {app.clientName} ({app.date} {app.timeSlot})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerManualReminder(selectedAppId, 'reminder_24h')}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-amber-400 font-medium transition-colors border border-neutral-700 flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{t.btnRemind24h}</span>
            </button>
            <button
              onClick={() => triggerManualReminder(selectedAppId, 'reminder_2h')}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium transition-colors border border-amber-500/40 flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>{t.btnRemind2h}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/60">
          <span className="text-xs text-neutral-400 mr-1">Filtr:</span>
          {(['all', 'master', 'client'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {f === 'all' && `${t.filterAll} (${notifications.length})`}
              {f === 'master' && `${t.filterMasters} (${notifications.filter(n => n.recipientType === 'master').length})`}
              {f === 'client' && `${t.filterClients} (${notifications.filter(n => n.recipientType === 'client').length})`}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              Brak powiadomień w tej kategorii
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-neutral-950/40 border-neutral-800/60 opacity-80'
                    : 'bg-neutral-950 border-amber-500/40 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    {n.recipientType === 'master' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" />
                        Barber: {n.recipientName}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5" />
                        {n.recipientName} ({n.channel.toUpperCase()})
                      </span>
                    )}

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {n.timestamp}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-neutral-100 mb-1">
                  {n.title}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            {t.btnClose}
          </button>
        </div>

      </div>
    </div>
  );
};
