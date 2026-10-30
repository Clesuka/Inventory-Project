import React from 'react';
import {
  Cpu,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Receipt,
  History,
  Users,
  LogOut,
  ShieldCheck,
  UserCheck,
  X,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface SidebarProps {
  currentTab: 'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users';
  onSelectTab: (tab: 'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users') => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { currentUser, logout, items, rmas } = useApp();

  const isAdmin = currentUser?.role === 'Admin';
  const lowStockCount = items.filter((i) => i.stock <= i.minStockAlert).length;
  const openRmaCount = rmas.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'SENT_TO_VENDOR').length;

  const handleNavClick = (tab: 'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users') => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      
      {/* 1. TOP ZONE: Clickable POS LOGO (Directs to Homepage / Landing Page) */}
      <div>
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            title="Go to Homepage / Store Overview"
            className="flex items-center gap-3 text-left group cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:bg-blue-700 transition-colors shrink-0">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Ace World
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 uppercase">
                  POS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
                Computer Inventory OS
              </span>
            </div>
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MIDDLE ZONE: Navigation Menu Links */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Terminal Menu
          </div>

          {/* Store Overview Dashboard */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
            {currentTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
          </button>

          {/* POS Register */}
          <button
            type="button"
            onClick={() => handleNavClick('pos')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'pos'
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>POS Register</span>
            </div>
            {currentTab === 'pos' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
          </button>

          {/* Inventory */}
          <button
            type="button"
            onClick={() => handleNavClick('inventory')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'inventory'
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes className="w-4 h-4 shrink-0" />
              <span>Inventory</span>
            </div>
            {lowStockCount > 0 ? (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  currentTab === 'inventory'
                    ? 'bg-white text-blue-700'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}
              >
                {lowStockCount}
              </span>
            ) : (
              currentTab === 'inventory' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>

          {/* Sales History */}
          <button
            type="button"
            onClick={() => handleNavClick('sales')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'sales'
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Sales Ledger</span>
            </div>
            {currentTab === 'sales' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
          </button>

          {/* Warranty & RMA Center */}
          <button
            type="button"
            onClick={() => handleNavClick('warranty')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'warranty'
                ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Warranty & RMA</span>
            </div>
            {openRmaCount > 0 ? (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  currentTab === 'warranty'
                    ? 'bg-white text-blue-700'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                }`}
              >
                {openRmaCount}
              </span>
            ) : (
              currentTab === 'warranty' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>

          {/* Admin Restricted Section */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Admin Controls
              </div>

              {/* Audit Logs */}
              <button
                type="button"
                onClick={() => handleNavClick('logs')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'logs'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </div>
                {currentTab === 'logs' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>

              {/* User Management */}
              <button
                type="button"
                onClick={() => handleNavClick('users')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  currentTab === 'users'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>User Accounts</span>
                </div>
                {currentTab === 'users' && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </button>
            </>
          )}

        </div>
      </div>

      {/* 3 & 4. BOTTOM ZONE: Current User Card & Logout Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        
        {/* 3. Current User Identity Card */}
        {currentUser && (
          <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${currentUser.avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  <span
                    className={`font-semibold ${
                      isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                  <span>·</span>
                  <span className="truncate">@{currentUser.userId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Logout Button */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Terminal</span>
        </button>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar (260px) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 select-none shrink-0 no-print">
        {navContent}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};
