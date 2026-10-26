import React, { useMemo } from 'react';
import {
  ShoppingCart,
  Boxes,
  DollarSign,
  AlertTriangle,
  Receipt,
  UserPlus,
  ArrowRight,
  Package,
  History,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SaleRecord } from '../types';
import { formatIDR } from '../utils/formatters';

interface DashboardViewProps {
  onNavigate: (tab: 'dashboard' | 'inventory' | 'pos' | 'warranty' | 'logs' | 'sales' | 'users') => void;
  onOpenAddItem: () => void;
  onViewReceipt: (sale: SaleRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddItem,
  onViewReceipt,
}) => {
  const { currentUser, items, sales, auditLogs, rmas } = useApp();

  const isAdmin = currentUser?.role === 'Admin';

  // Compute metrics
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.finalTotal, 0);
  }, [sales]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, i) => sum + i.stock, 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.stock <= i.minStockAlert).length;
  }, [items]);

  const openRmaCount = useMemo(() => {
    return rmas.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'SENT_TO_VENDOR').length;
  }, [rmas]);

  const recentSales = useMemo(() => {
    return sales.slice(0, 4);
  }, [sales]);

  const recentLogs = useMemo(() => {
    return auditLogs.slice(0, 4);
  }, [auditLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/15 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-medium tracking-wide mb-3">
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            <span>Signed in as {currentUser?.role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight leading-tight">
            Welcome back, {currentUser?.name}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
            RigForge PC Depot is ready. You have {lowStockCount > 0 ? `${lowStockCount} items requiring stock reorder` : 'all inventory levels nominal'}.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Checkout</span>
            </button>
            <button
              onClick={onOpenAddItem}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add PC Component</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Sales Volume</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {formatIDR(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Across {sales.length} transactions</span>
          </div>
        </div>

        {/* Total Units */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">In-Stock Units</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {totalUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {items.length} hardware SKUs
          </div>
        </div>

        {/* Completed Sales */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Sales Receipts</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            {sales.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Customer checkout slips issued
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
            <span className={lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
              {lowStockCount}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lowStockCount > 0 ? 'Parts at or below minimum threshold' : 'All stock levels healthy'}
          </div>
        </div>

      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Quick Workflows
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <button
            onClick={() => onNavigate('pos')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
              <span>POS Register</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Start new sale with instant cart and single/multi price overrides.
            </p>
          </button>

          <button
            onClick={() => onNavigate('inventory')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Manage PC parts, filter by category/brand, and adjust stock.
            </p>
          </button>

          <button
            onClick={onOpenAddItem}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
              <span>Add New Part</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Register new GPU, CPU, RAM, or PC accessory into stock.
            </p>
          </button>

          {isAdmin ? (
            <button
              onClick={() => onNavigate('users')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                <span>Manage Users</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Provision employee accounts and configure Admin/Staff roles.
              </p>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('sales')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                <span>Sales Ledger</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                View previous transactions and reprint customer receipts.
              </p>
            </button>
          )}

          {/* Warranty & RMA Center */}
          <button
            onClick={() => onNavigate('warranty')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Warranty & RMA</span>
                {openRmaCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-amber-500 text-slate-900 px-1.5 py-0.2 rounded-full">
                    {openRmaCount}
                  </span>
                )}
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Verify serial numbers, check expiration, and file unit RMA claims.
            </p>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Recent Sales & Store Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Checkout Slips */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" />
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Recent Sales Transactions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              View All ({sales.length})
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No sales completed yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {sale.receiptNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                      {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                      {formatIDR(sale.finalTotal)}
                    </span>
                    <button
                      onClick={() => onViewReceipt(sale)}
                      className="px-2 py-1 rounded text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Activity Trail */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500" />
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Store Operations Audit Trail
              </h3>
            </div>
            {isAdmin && (
              <button
                onClick={() => onNavigate('logs')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                View Full Log ({auditLogs.length})
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <strong className="text-slate-800 dark:text-slate-200">{log.operatorName}</strong>
                    <span>({log.operatorRole})</span>
                  </div>
                  <span className="font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
                  {log.entityName}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
