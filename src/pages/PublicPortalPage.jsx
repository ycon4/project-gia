import { useState, useEffect } from 'react';
import { Eye, AlertCircle, Loader2, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import giaLogo from '../assets/GIA Logo.svg';
import StudentEnrollmentVisuals from '../components/visuals/StudentEnrollmentVisuals';
import PublicEventsList from '../components/events/PublicEventsList'; // 👈 NATIVE INTEGRATION IMPORT

export default function PublicPortalPage() {
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── LOCAL THEME ENGINE ──
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('gadc-public-theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Inject 'dark' class straight onto document root for Tailwind dark: modifiers
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#fcfcfd] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 overflow-hidden antialiased select-none transition-colors duration-200">

      {/* Premium Minimal Backdrop Blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[30%] h-[30%] bg-purple-500/5 dark:bg-purple-950/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/5 dark:bg-indigo-950/10 rounded-full blur-[120px]" />
      </div>

      {/* Low-Profile Application Navigation Header */}
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
              background: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)'
            }}
          />
          <div>
            <h1 className="text-xs font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              MSU-IIT GADC Public Portal
            </h1>
            <p className="text-[9px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
              Gender and Development Center
            </p>
          </div>
        </div>

        {/* System Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Dynamic Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 transition-all cursor-pointer"
          >
            {darkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
          </button>

          {/* Access Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
            <Eye size={10} className="animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Read-Only Guest View
            </span>
          </div>
        </div>
      </header>

      {/* Main Structural Frame split */}
      <div className="flex-1 flex min-h-0 relative justify-center">

        {/* NETWORK STATUS SCREEN OVERLAYS */}
        {loading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50">
            <Loader2 size={24} className="text-purple-600 dark:text-purple-400 animate-spin" />
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Loading Workspace Assets...</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 bg-white dark:bg-[#09090b] flex flex-col items-center justify-center p-4 text-center z-50">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Network Connection Failure</h3>
            <p className="text-[11px] text-neutral-400 max-w-xs mb-3">{error}</p>
            <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all">
              Retry Reconnection
            </button>
          </div>
        )}

        {/* WORKSPACE GRID: Left Analytics Frame, Right Public Timeline Frame */}
        {!loading && !error && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] h-full w-full max-w-[1550px] px-4 py-3 gap-3">

            {/* LEFT VIEWPORT: Pure Data Metrics Studio */}
            <div className="flex flex-col min-h-0">
              <div className="flex-1 bg-white dark:bg-[#111113] border border-neutral-200/70 dark:border-neutral-800/80 rounded-xl p-3 shadow-xs relative flex flex-col min-h-0 overflow-hidden transition-colors">
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-1 rounded border border-neutral-200/40 dark:border-neutral-700/60">
                  <LayoutDashboard size={11} className="text-purple-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Demographic Frameworks</span>
                </div>

                <div className="flex-1 w-full h-full min-h-0 mt-6">
                  <StudentEnrollmentVisuals
                    data={enrollmentData}
                    recordsCount={recordCount}
                    academicPeriod="All Academic Years"
                    isPublic={true}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT VIEWPORT: Integrated High-Density Event Timeline Container */}
            <div className="border border-neutral-200/70 dark:border-neutral-800/80 bg-white dark:bg-[#111113] rounded-xl p-3.5 flex flex-col min-h-0 shadow-xs transition-colors">

              {/* NATIVE INTEGRATION RENDERING HOOK */}
              <PublicEventsList />

            </div>

          </div>
        )}
      </div>
    </div>
  );
}