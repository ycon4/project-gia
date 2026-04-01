import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { ShieldCheck } from 'lucide-react';
import giaLogo from '../assets/GIA Logo.svg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-gia-100/35 dark:bg-gia-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-gia-50/50 dark:bg-gia-950/30 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-sm px-6 py-12">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <img src={giaLogo} alt="GIA" className="w-20 h-20 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(22%) sepia(90%) saturate(2500%) hue-rotate(272deg) brightness(0.9)' }} />
          </div>
          <h1 className="text-p4-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">
            MSU-IIT GADC
          </h1>
          <p className="text-p4-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1.5">
            Information Assistant
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-md shadow-gia-900/5 border border-gia-100/60 dark:border-neutral-700/50 p-8">
          <h2 className="text-p4-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-1">
            Welcome back
          </h2>
          <p className="text-p4-sm text-slate-500 dark:text-slate-400 font-medium mb-7">
            Sign in to access the dashboard
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-p4-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@msuiit.edu.ph"
                required
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-gia-200/80 dark:border-neutral-600/60 rounded-xl px-4 py-3
                  text-p4-base text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-p4-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-gia-200/80 dark:border-neutral-600/60 rounded-xl px-4 py-3
                  text-p4-base text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-gia-500/30 focus:border-gia-500 transition-all duration-200"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-p4-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gia-600 hover:bg-gia-700 disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-bold rounded-xl px-6 py-3.5 text-p4-base transition-all duration-200
                shadow-md shadow-gia-600/25 hover:shadow-lg hover:shadow-gia-600/30 mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-p4-xs text-slate-400 dark:text-slate-500 font-medium">
          <ShieldCheck size={13} className="text-gia-400" />
          Authorized access only
        </div>
      </div>
    </div>
  );
}
