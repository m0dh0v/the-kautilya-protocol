'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertTriangle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Drives the one-time reveal sequence: eye opens, pulses ring outward,
  // then the form fades in. Runs once on mount, never loops.
  const [revealStage, setRevealStage] = useState<'opening' | 'pulsing' | 'settled'>('opening');

  useEffect(() => {
    const t1 = setTimeout(() => setRevealStage('pulsing'), 900);
    const t2 = setTimeout(() => setRevealStage('settled'), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (res.ok) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        setError(data.error || 'Invalid username or password.');
        setSubmitting(false);
      }
    } catch {
      setError('Could not reach the server. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#04060B] overflow-hidden px-4">
      {/* faint grid backdrop, matches the network/intel aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* --- THE THIRD EYE + NETWORK PULSE REVEAL --- */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          {/* expanding network pulse rings, fire once after the eye opens */}
          {(revealStage === 'pulsing' || revealStage === 'settled') && (
            <>
              <span className="absolute w-10 h-10 rounded-full border border-blue-400/60 kp-pulse-ring" />
              <span className="absolute w-10 h-10 rounded-full border border-blue-400/40 kp-pulse-ring kp-pulse-ring-delay-1" />
              <span className="absolute w-10 h-10 rounded-full border border-orange-400/30 kp-pulse-ring kp-pulse-ring-delay-2" />
            </>
          )}

          <svg viewBox="0 0 200 120" className="relative w-36 h-auto" aria-hidden="true">
            {/* upper lid */}
            <path
              d="M 10 60 Q 100 10 190 60"
              fill="none"
              stroke="#F97316"
              strokeWidth="4"
              strokeLinecap="round"
              className="kp-lid-upper"
            />
            {/* lower lid */}
            <path
              d="M 10 60 Q 100 110 190 60"
              fill="none"
              stroke="#F97316"
              strokeWidth="4"
              strokeLinecap="round"
              className="kp-lid-lower"
            />
            {/* iris, scales in once the lids have parted */}
            <circle cx="100" cy="60" r="22" fill="#0B1220" stroke="#3B82F6" strokeWidth="2" className="kp-iris" />
            {/* vertical pupil, the third-eye motif */}
            <rect x="96" y="42" width="8" height="36" rx="4" fill="#EA580C" className="kp-pupil" />
          </svg>
        </div>

        <style>{`
          .kp-lid-upper {
            stroke-dasharray: 220;
            stroke-dashoffset: 220;
            animation: kp-draw 0.9s ease-out forwards;
          }
          .kp-lid-lower {
            stroke-dasharray: 220;
            stroke-dashoffset: 220;
            animation: kp-draw 0.9s ease-out forwards;
          }
          .kp-iris, .kp-pupil {
            opacity: 0;
            transform-origin: 100px 60px;
            transform: scale(0.4);
            animation: kp-open 0.5s ease-out 0.7s forwards;
          }
          @keyframes kp-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes kp-open {
            to { opacity: 1; transform: scale(1); }
          }
          .kp-pulse-ring {
            animation: kp-pulse 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
          }
          .kp-pulse-ring-delay-1 { animation-delay: 0.35s; }
          .kp-pulse-ring-delay-2 { animation-delay: 0.7s; }
          @keyframes kp-pulse {
            0% { transform: scale(1); opacity: 0.9; }
            100% { transform: scale(4.2); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .kp-lid-upper, .kp-lid-lower, .kp-iris, .kp-pupil, .kp-pulse-ring {
              animation: none !important;
              stroke-dashoffset: 0 !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>

        {/* --- HEADER TEXT --- */}
        <h1 className="text-white font-mono font-black text-lg tracking-[0.25em] uppercase text-center">
          Kautilya Protocol
        </h1>
        <p className="text-slate-500 text-[11px] font-mono tracking-widest mt-1 mb-8">
          RESTRICTED ACCESS
        </p>

        {/* --- LOGIN FORM, fades in once the reveal has settled --- */}
        <form
          onSubmit={handleSubmit}
          className={`w-full flex flex-col gap-4 transition-opacity duration-500 ${
            revealStage === 'settled' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-mono font-bold text-xs tracking-widest uppercase rounded-lg py-3 transition-colors"
          >
            {submitting ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
