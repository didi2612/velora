'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Zap, X } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/items', icon: Package, label: 'Items' },
  { to: '/transactions', icon: BarChart3, label: 'Transactions' },
];

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-slate-900 border-r border-slate-700/60 flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:z-auto`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Velora</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
          {NAV.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link key={to} href={to} onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-700/60">
          <p className="text-xs text-slate-500">Velora v2.0.0</p>
        </div>
      </aside>
    </>
  );
}
