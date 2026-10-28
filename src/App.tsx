import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { MessengerSimulator } from './components/MessengerBot/MessengerSimulator';
import { ClientWebApp } from './components/ClientPortal/ClientWebApp';
import { MasterSchedule } from './components/MasterPortal/MasterSchedule';
import { AdminDashboard } from './components/AdminCRM/AdminDashboard';
import { BARBERSHOP_INFO } from './data/mockData';
import { Scissors } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, currentLang } = useApp();

  const address = BARBERSHOP_INFO.address[currentLang] || BARBERSHOP_INFO.address.pl;
  const hours = BARBERSHOP_INFO.workHours[currentLang] || BARBERSHOP_INFO.workHours.pl;

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="flex-1">
        {activeTab === 'bot' && <MessengerSimulator />}
        {activeTab === 'client' && <ClientWebApp />}
        {activeTab === 'master' && <MasterSchedule />}
        {activeTab === 'admin' && <AdminDashboard />}
      </div>

      {/* Barbershop Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-xs text-neutral-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-neutral-200">{BARBERSHOP_INFO.name}</span>
            <span className="text-neutral-500">•</span>
            <span>{address}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>{hours}</span>
            <span>Tel: {BARBERSHOP_INFO.phone}</span>
            <span className="text-amber-400 font-bold">TG / WA / IG / FB Bot v2.5 (PL / UK / RU)</span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-black">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
}
