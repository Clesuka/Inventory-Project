import React from 'react';
import { Menu, Cpu, CircleDot, Cloud } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';

interface HeaderProps {
  currentTab: 'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users';
  onOpenMobileMenu: () => void;
  onNavigateHome: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Store Overview & Real-Time Metrics' },
  inventory: { title: 'Inventory Management', subtitle: 'Hardware Parts & Stock Levels' },
  pos: { title: 'POS Register', subtitle: 'Checkout Terminal & Transactions' },
  warranty: { title: 'Warranty & RMA Center', subtitle: 'Serial Number Verification & Claims' },
  sales: { title: 'Sales History', subtitle: 'Completed Orders & Receipts' },
  logs: { title: 'Audit Trail', subtitle: 'System Activity & Stock Tracking' },
  users: { title: 'User Accounts', subtitle: 'Operator Credentials & Permissions' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onNavigateHome,
}) => {
  const { currentUser, isCloudConnected } = useApp();
  const tabInfo = TAB_TITLES[currentTab] || { title: 'Terminal', subtitle: 'RigForge POS' };
  const isAdmin = currentUser?.role === 'Admin';

  return (
    <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between no-print transition-colors">
      {/* Left side: Mobile drawer trigger & Active View Title / Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button (< 1024px) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Link (< 1024px) */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="lg:hidden flex items-center gap-2 cursor-pointer focus:outline-hidden"
          title="Go to Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
            RigForge
          </span>
        </button>

        {/* Desktop View Header Title & Subtitle (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base text-slate-900 dark:text-white tracking-tight">
                {tabInfo.title}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs"
                title="Synchronized with Google Cloud Firebase Firestore"
              >
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span>Firestore Live</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tabInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Top Header Sliding Theme Toggle & User Info */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* The Sliding Theme Toggle Switch */}
        <div className="flex items-center gap-2">
          <ThemeToggleSwitch showLabels={false} />
        </div>

        {/* User Profile Pill */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0`}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span
                  className={`font-semibold ${
                    isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {currentUser.role}
                </span>
                <span>·</span>
                <span className="text-slate-400">@{currentUser.userId}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
