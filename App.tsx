
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ReportMap } from './components/ReportMap';
import { ReportForm } from './components/ReportForm';
import { FindHelpTab } from './components/FindHelpTab';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { AuthorityPanel } from './components/AuthorityPanel';
import { AuthFlow } from './components/AuthFlow';
import { auth } from './services/firebaseConfig';
import { reportService } from './services/reportService';
import { syncService } from './services/syncService';
import { authService, mapUser } from './services/authService';
import { Report, UserProfile } from './types';
import { Map, Camera, Hospital, LayoutDashboard, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState(-1); // -1 is Dashboard
  const [reports, setReports] = useState<Report[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.0060]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser(mapUser(firebaseUser));
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      const verified = await reportService.getVerifiedReports();
      setReports(verified);
    };
    fetchReports();

    setPendingSyncCount(syncService.getPending().length);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      }, () => console.warn("Location permission denied"));
    }

    const handleSync = async () => {
      if (navigator.onLine && user) {
        await syncService.syncPending((msg) => setSyncMessage(msg));
        setPendingSyncCount(syncService.getPending().length);
        const verified = await reportService.getVerifiedReports();
        setReports(verified);
        setTimeout(() => setSyncMessage(null), 3000);
      }
    };

    window.addEventListener('online', handleSync);
    if (navigator.onLine) handleSync();
    return () => window.removeEventListener('online', handleSync);
  }, [user]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentTab(-1);
  };

  if (!user) {
    return <AuthFlow onLoginSuccess={setUser} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case -1: return <Dashboard user={user} onNavigate={setCurrentTab} pendingSyncCount={pendingSyncCount} />;
      case 0: return <ReportMap reports={reports} userLocation={userLocation} currentRole={user.role} />;
      case 1: return <ReportForm onSuccess={async () => { setReports(await reportService.getVerifiedReports()); setCurrentTab(0); }} />;
      case 2: return <FindHelpTab onNavigate={setCurrentTab} />;
      case 3: return <AdminPanel currentUser={user} />;
      case 4: return <AuthorityPanel />;
      default: return <Dashboard user={user} onNavigate={setCurrentTab} pendingSyncCount={pendingSyncCount} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 selection:bg-red-500/20 selection:text-red-200">
      <Header onLogout={handleLogout} />

      {syncMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[5000] glass px-8 py-3 rounded-full flex items-center gap-3 text-xs font-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-bounce border-blue-500/20 text-blue-400 uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          {syncMessage}
        </div>
      )}

      <main className="flex-1 relative overflow-auto pb-32">
        {renderContent()}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-[2.5rem] px-4 py-4 flex justify-around items-center z-[4000] border border-white/10 shadow-2xl w-[90%] sm:w-[450px]">
        {[
          { icon: LayoutDashboard, label: 'Home', tab: -1 },
          { icon: Map, label: 'Map', tab: 0 },
          { icon: Camera, label: 'Alert', tab: 1 },
          { icon: Hospital, label: 'Help', tab: 2 }
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab)}
            className={`flex flex-col items-center gap-1.5 transition-all group relative px-4 ${currentTab === item.tab ? 'text-red-500' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <div className={`p-1 px-4 rounded-xl transition-all duration-500 ${currentTab === item.tab ? 'bg-red-500/10' : 'group-hover:bg-white/5'}`}>
              <item.icon className={`w-6 h-6 transition-transform duration-300 ${currentTab === item.tab ? 'scale-110' : 'group-hover:scale-110'}`} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            {currentTab === item.tab && (
              <div className="absolute -bottom-1 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
