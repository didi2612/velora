'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Maximize2, Minimize2 } from 'lucide-react';
import Sidebar from './Sidebar';
import FullscreenLauncher from './FullscreenLauncher';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/orders': 'Orders', '/items': 'Items', '/transactions': 'Transactions',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [collapsed, setCollapsed]       = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Velora';

  useEffect(() => {
    function onFSChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* ignore */ }
  }

  // Customer display — no sidebar, no header
  if (pathname === '/customer') return <>{children}</>;

  return (
    <>
      <FullscreenLauncher />

      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
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

            <div className="flex items-center gap-2">
              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>

              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                V
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
