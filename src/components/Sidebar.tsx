'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3,
  Zap, X, ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import type { SessionUser } from '@/lib/auth';

const BASE_NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/orders',       icon: ShoppingCart,    label: 'Orders'       },
  { to: '/items',        icon: Package,         label: 'Items'        },
  { to: '/transactions', icon: BarChart3,       label: 'Transactions' },
];

const ADMIN_NAV = [
  { to: '/admin/vendors', icon: Users, label: 'Vendors' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: SessionUser | null;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, user }: Props) {
  const pathname = usePathname();
  const nav = user?.role === 'admin' ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full bg-slate-900 border-r border-slate-700/60
          flex flex-col
          transition-[width,transform] duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:z-auto
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div
          className={`
            flex items-center border-b border-slate-700/60 flex-shrink-0
            ${collapsed ? 'justify-center px-3 py-5' : 'justify-between px-5 py-5'}
          `}
        >
          {collapsed ? (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50 flex-shrink-0">
              <Zap size={16} className="text-white" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50 flex-shrink-0">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight truncate">Velora</span>
              </div>
              {/* Mobile close */}
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Menu
            </p>
          )}

          {nav.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                href={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                className={`
                  flex items-center rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
                  ${isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
                  }
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer — collapse toggle (desktop only) */}
        <div className={`border-t border-slate-700/60 flex-shrink-0 ${collapsed ? 'p-2' : 'px-3 py-4'}`}>
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`
              hidden lg:flex w-full items-center rounded-lg
              text-slate-400 hover:text-white hover:bg-slate-700
              transition-colors duration-150
              ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
            `}
          >
            {collapsed
              ? <ChevronRight size={16} />
              : <><ChevronLeft size={16} /><span className="text-xs font-medium">Collapse</span></>
            }
          </button>
          {!collapsed && <p className="mt-2 px-3 text-xs text-slate-600">Velora v2.0.0</p>}
        </div>
      </aside>
    </>
  );
}
