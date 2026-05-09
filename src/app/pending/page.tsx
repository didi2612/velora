'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, Zap } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';

export default function PendingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  async function fetchMe() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user) {
        router.push('/login');
        return;
      }
      if (data.user.status === 'active') {
        router.push('/');
        return;
      }
      if (data.user.status === 'rejected') {
        router.push('/login?reason=rejected');
        return;
      }
      setUser(data.user);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchMe();
    const interval = setInterval(fetchMe, 10_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50 mb-3">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Velora</h1>
        </div>

        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Pending Approval</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your vendor account is awaiting admin approval. You&apos;ll be automatically redirected
            once your account is approved.
          </p>

          {user && (
            <div className="bg-slate-800 rounded-xl p-4 text-left mb-6 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Details</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-200 truncate ml-4 max-w-[180px]">{user.email}</span>
              </div>
              {user.shopName && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shop</span>
                  <span className="text-slate-200 truncate ml-4 max-w-[180px]">{user.shopName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Pending
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 mb-4">Checking status every 10 seconds…</p>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
