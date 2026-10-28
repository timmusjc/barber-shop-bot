import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Language } from '../types';
import { 
  Scissors, 
  Bot, 
  Calendar, 
  UserCheck, 
  LayoutDashboard, 
  Bell, 
  Globe,
  ChevronDown
} from 'lucide-react';
import { NotificationModal } from './NotificationModal';

export const Header: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    notifications, 
    selectedMasterId, 
    masters, 
    setSelectedMasterId,
    unreadCountForMaster,
    currentLang,
    setLanguage,
    t
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const unreadTotal = notifications.filter(n => !n.read).length;
  const currentMasterUnread = unreadCountForMaster(selectedMasterId);

  const languages: Array<{ code: Language; label: string; flag: string }> = [
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const currentLangObj = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <>
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/20 font-black">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-wider text-neutral-100 uppercase font-sans">
                    BLADE & CROWN
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                    OmniBot Pro
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  {t.appTagline}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center bg-neutral-950/80 p-1 rounded-xl border border-neutral-800/80 shadow-inner">
              <button
                onClick={() => setActiveTab('bot')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'bot'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>{t.tabBot}</span>
              </button>

              <button
                onClick={() => setActiveTab('client')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'client'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{t.tabBooking}</span>
                <span className="sm:hidden">{t.tabBooking.split(' / ')[0]}</span>
              </button>

              <button
                onClick={() => setActiveTab('master')}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'master'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.tabMaster}</span>
                {currentMasterUnread > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.tabAdmin}</span>
              </button>
            </nav>

            {/* Right side: Language Switcher & Notification Bell */}
            <div className="flex items-center gap-2">
              
              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-200 text-xs font-bold transition-colors"
                  title="Zmień język / Сменить язык / Змінити мову"
                  aria-label="Język"
                >
                  <span className="text-sm">{currentLangObj.flag}</span>
                  <span className="hidden md:inline uppercase">{currentLangObj.code}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-500 border-b border-neutral-800/80">
                      Wybierz język / Мова / Язык
                    </div>
                    {languages.map(l => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                          currentLang === l.code
                            ? 'bg-amber-500/10 text-amber-400 font-bold'
                            : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{l.flag}</span>
                          <span>{l.label}</span>
                        </div>
                        {currentLang === l.code && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Master Quick Switcher when in Master Tab */}
              {activeTab === 'master' && (
                <div className="hidden lg:flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-xs">
                  <span className="text-neutral-400">{t.barber}</span>
                  <select
                    value={selectedMasterId}
                    onChange={(e) => setSelectedMasterId(e.target.value)}
                    className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
                  >
                    {masters.map(m => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-neutral-100">
                        {m.name} ({m.nickname})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notification Center Trigger */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-200 hover:text-amber-400 transition-colors"
                title={t.notifications}
                aria-label="Powiadomienia"
              >
                <Bell className="w-5 h-5" />
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-900 animate-bounce">
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Notification Drawer Modal */}
      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
};
