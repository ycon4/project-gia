import { useState, useEffect, useMemo } from 'react';
import { Eye, AlertCircle, Loader2, LayoutDashboard, Sun, Moon, MessageSquare, X, Sparkles } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import giaLogo from '../assets/GIA Logo.svg';
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals';
import PublicEventsList from '../components/events/PublicEventsList';
import ChatPage from './ChatPage';

export default function PublicPortalPage() {
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // ── LOCAL THEME ENGINE ──
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('gadc-public-theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('gadc-public-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('gadc-public-theme', 'light');
    }
  }, [darkMode]);

  // Real-time Student Matrix Enrollment Sync
  useEffect(() => {
    console.log('🌐 Public Portal: Initializing enrollment pipeline...');
    const enrollmentRef = collection(db, 'student_enrollment');

    const unsubscribe = onSnapshot(enrollmentRef, (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEnrollmentData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to sync student matrix data.');
        setLoading(false);
      }
    }, () => {
      setError('Database connection refused.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const recordCount = enrollmentData.length;

  // Filter to most recent academicYear period only
  const { filteredEnrollment, mostRecentPeriod } = useMemo(() => {
    if (!enrollmentData.length) return { filteredEnrollment: [], mostRecentPeriod: '' };

    // Collect all unique periods and sort most recent first
    const periods = [...new Set(enrollmentData.map(d => d.academicYear).filter(Boolean))];
    const sorted = periods.sort((a, b) => {
      const yearA = parseInt(a.split('-')[0]) || 0;
      const yearB = parseInt(b.split('-')[0]) || 0;
      if (yearA !== yearB) return yearB - yearA;
      const semA = a.includes('1st') ? 1 : a.includes('2nd') ? 2 : 3;
      const semB = b.includes('1st') ? 1 : b.includes('2nd') ? 2 : 3;
      return semB - semA; // Most recent semester first (2nd > 1st)
    });

    const latest = sorted[0];
    const filtered = latest ? enrollmentData.filter(d => d.academicYear === latest) : enrollmentData;
    return { filteredEnrollment: filtered, mostRecentPeriod: latest || '' };
  }, [enrollmentData]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 overflow-hidden antialiased select-none transition-colors duration-200">

      {/* Premium Institutional Structural Backdrop Gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-[#741112]/[0.03] dark:bg-[#741112]/[0.05] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-[#D4AF37]/[0.02] dark:bg-[#D4AF37]/[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Low-Profile Academic Navigation Header */}
      <header className="h-14 border-b border-neutral-200/50 dark:border-neutral-800/60 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 shrink-0 rounded-lg p-2"
            style={{
              WebkitMaskImage: `url(${giaLogo})`,
              maskImage: `url(${giaLogo})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              background: 'linear-gradient(135deg, #741112 0%, #530B0C 100%)'
            }}
          />
          <div>
            <h1 className="text-xs font-black tracking-tight text-neutral-900 dark:text-neutral-50 uppercase">
              MSU-IIT GADC Public Portal
            </h1>
            <p className="text-[9px] text-[#741112] dark:text-rose-400 font-black uppercase tracking-widest">
              Gender and Development Center
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 transition-all cursor-pointer"
          >
            {darkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] text-neutral-500 dark:text-neutral-400 text-[9px] font-black uppercase tracking-wider">
            <Eye size={11} className="text-neutral-400" />
            Read-Only Guest View
          </div>
        </div>
      </header>

      {/* Main Structural Layout Viewport */}
      <div className="flex-1 flex min-h-0 relative justify-center">

        {loading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-50">
            <Loader2 size={20} className="text-[#741112] dark:text-rose-400 animate-spin" />
            <p className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 tracking-widest uppercase">Syncing Workspace Framework...</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 bg-white dark:bg-[#09090b] flex flex-col items-center justify-center p-4 text-center z-50">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Network Link Refused</h3>
            <p className="text-[11px] text-neutral-400 max-w-xs mb-3 font-medium">{error}</p>
            <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-[#741112] text-white rounded-lg text-xs font-bold transition-all">
              Retry Connection Pipeline
            </button>
          </div>
        )}

        {/* WORKSPACE COMPRESSION GRID */}
        {!loading && !error && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] h-full w-full max-w-[1600px] px-4 py-3 gap-3">

            {/* COMPRESSED LEFT VIEWPORT */}
            <div className="flex flex-col min-h-0">
              <div className="flex-1 bg-white dark:bg-[#111113] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl p-3 shadow-xs relative flex flex-col min-h-0 overflow-hidden transition-colors">

                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-1 rounded border border-neutral-200/40 dark:border-neutral-700/60">
                  <LayoutDashboard size={11} className="text-[#741112] dark:text-rose-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Demographic Frameworks</span>
                  {mostRecentPeriod && (
                    <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500">· {mostRecentPeriod}</span>
                  )}
                </div>

                <div className="flex-1 w-full h-full min-h-0 mt-6">
                  <StudentEnrollmentVisuals
                    data={filteredEnrollment}
                    recordsCount={filteredEnrollment.length}
                    academicPeriod={mostRecentPeriod || 'All Academic Years'}
                    isPublic={true}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT VIEWPORT */}
            <div className="border border-neutral-200/70 dark:border-neutral-800/80 bg-white dark:bg-[#111113] rounded-xl p-3.5 flex flex-col min-h-0 shadow-xs transition-colors">
              <PublicEventsList />
            </div>

          </div>
        )}

        {/* ── FIXED HEIGHT-LOCKED AI SYSTEM DRAWER (MODIFIED TO 1/3 SCREEN VIEWPORT) ── */}
        <div
          className={`fixed top-14 right-0 bottom-0 z-40 w-full sm:w-[500px] md:w-[45vw] lg:w-[35vw] xl:w-[33vw] max-w-[650px] bg-white dark:bg-[#111113] border-l border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${chatOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          {/* Drawer Header Layout Block */}
          <div className="p-4 border-b border-neutral-200/50 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-[#151518]/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#741112]/10 dark:bg-[#741112]/20 flex items-center justify-center text-[#741112] dark:text-rose-400">
                <Sparkles size={12} />
              </div>
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-[#741112] dark:text-rose-400 leading-none">Knowledge Node</h3>
                <h2 className="text-xs font-black text-neutral-900 dark:text-neutral-50 tracking-tight mt-1">GADC AI Matrix Assistant</h2>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* DEDICATED FIXED HEIGHT BOX WRAPPER FOR CHATPAGE INJECTION */}
          <div className="flex-1 min-h-0 relative flex flex-col bg-neutral-50/20 dark:bg-[#0c0c0e]/10">
            <ChatPage
              user={null}
              displayName="Guest User"
              conversations={[]}
              setConversations={() => { }}
              activeConvId={null}
              setActiveConvId={() => { }}
              isPublicView={true}
            />
          </div>

          {/* Secure Contextual Footnote Label */}
          <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/30 dark:bg-[#151518]/30 text-center text-[9px] text-neutral-400 font-bold uppercase tracking-wider shrink-0 select-none">
            Isolated Public Knowledge Engine Session
          </div>
        </div>

        {/* ── FIXED FLOAT INTERACTION TRIGGER BUTTON ── */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={`fixed bottom-5 right-5 z-40 h-11 px-4 rounded-xl shadow-lg border flex items-center gap-2.5 font-black uppercase tracking-wider text-[10px] transition-all duration-300 transform active:scale-95 cursor-pointer ${chatOpen
            ? 'bg-neutral-900 border-neutral-800 text-white dark:bg-white dark:border-white dark:text-black shadow-neutral-950/20 hover:bg-neutral-800'
            : 'bg-gradient-to-br from-[#741112] to-[#530B0C] border-[#741112]/20 text-white hover:text-[#D4AF37] hover:shadow-[#741112]/10 hover:-translate-y-0.5'
            }`}
        >
          {chatOpen ? (
            <>
              <X size={14} className="animate-in spin-in-90 duration-200" />
              <span>Hide Assistant</span>
            </>
          ) : (
            <>
              <MessageSquare size={14} className="animate-pulse text-[#D4AF37]" />
              <span>Ask GADC AI</span>
            </>
          )}
        </button>

        {/* Backdrop Tint Blur Mask when Chat is Open */}
        {chatOpen && (
          <div
            onClick={() => setChatOpen(false)}
            className="fixed inset-0 top-14 bg-neutral-950/5 dark:bg-neutral-950/20 backdrop-blur-[1px] z-30 transition-opacity duration-300 animate-in fade-in"
          />
        )}

      </div>
    </div>
  );
}