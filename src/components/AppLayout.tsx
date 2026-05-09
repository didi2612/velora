'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Maximize2, Minimize2, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import FullscreenLauncher from './FullscreenLauncher';
import type { SessionUser } from '@/lib/auth';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/orders': 'Orders', '/items': 'Items',
  '/transactions': 'Transactions', '/admin/vendors': 'Vendors',
};

const NO_LAYOUT_PREFIXES = ['/customer', '/payment', '/login', '/register', '/pending'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [collapsed, setCollapsed]       = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser]                 = useState<SessionUser | null>(null);
  const pathname = usePathname();
  const router   = useRouter();
  const title    = PAGE_TITLES[pathname] ?? 'Velora';

  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* ignore */ }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  // Pages that bypass AppLayout (no sidebar/header)
  if (NO_LAYOUT_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <>{children}</>;
  }

  const displayName = user?.shopName ?? user?.email ?? '';
  const initials    = displayName ? displayName.charAt(0).toUpperCase() : 'V';

  return (
    <>
      <FullscreenLauncher />

      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          user={user}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="flex-none flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-lg font-semibold text-white">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              {/* User info */}
              {user && (
                <div className="flex items-center gap-2.5">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-medium text-slate-200 leading-tight">
                      {user.shopName ?? user.email}
                    </span>
                    <span className={`text-xs leading-tight capitalize ${user.role === 'admin' ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <LogOut size={17} />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
