import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Shield,
  Download,
  Trash2,
  Tag,
  ArrowRight,
  Boxes,
  ShoppingCart,
  PlusCircle,
  Edit2,
  Trash,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  UserPlus,
  UserMinus,
  UserCheck,
  Layers,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  Barcode,
} from 'lucide-react';
import { AuditLog, AuditAction } from '../types';
import { useApp } from '../context/AppContext';

export const AuditLogView: React.FC = () => {
  const { auditLogs, accounts, currentUser, clearLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<'All' | AuditAction>('All');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');

  const actionConfig: Record<
    AuditAction,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    CREATE_ITEM: {
      label: 'Item Created',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <PlusCircle className="w-3.5 h-3.5" />,
    },
    UPDATE_ITEM: {
      label: 'Item Updated',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <Edit2 className="w-3.5 h-3.5" />,
    },
    DELETE_ITEM: {
      label: 'Item Deleted',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <Trash className="w-3.5 h-3.5" />,
    },
    STOCK_ADJUSTMENT: {
      label: 'Stock Adjusted',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
    },
    SALE_COMPLETED: {
      label: 'Sale Completed',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
    },
    PRICE_OVERRIDE: {
      label: 'Price Override',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    NOTE_ADDED: {
      label: 'Note Added',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    CREATE_USER: {
      label: 'User Created',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      icon: <UserPlus className="w-3.5 h-3.5" />,
    },
    UPDATE_USER: {
      label: 'User Updated',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
    DELETE_USER: {
      label: 'User Deleted',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <UserMinus className="w-3.5 h-3.5" />,
    },
    CREATE_CATEGORY: {
      label: 'Category Created',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    UPDATE_CATEGORY: {
      label: 'Category Renamed',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: <Edit2 className="w-3.5 h-3.5" />,
    },
    DELETE_CATEGORY: {
      label: 'Category Deleted',
      bg: 'bg-pink-50 dark:bg-pink-950/40',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-200 dark:border-pink-800',
      icon: <Trash className="w-3.5 h-3.5" />,
    },
    ADD_SERIAL: {
      label: 'Serial Added',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Barcode className="w-3.5 h-3.5" />,
    },
    UPDATE_SERIAL: {
      label: 'Serial Updated',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
      icon: <Barcode className="w-3.5 h-3.5" />,
    },
    DELETE_SERIAL: {
      label: 'Serial Deleted',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <Trash className="w-3.5 h-3.5" />,
    },
    RMA_INITIATED: {
      label: 'RMA Filed',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
    RMA_RESOLVED: {
      label: 'RMA Resolved',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEntity = log.entityName.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchOperator = log.operatorName.toLowerCase().includes(q);
        if (!matchEntity && !matchDetails && !matchOperator) return false;
      }

      // Action Filter
      if (selectedAction !== 'All' && log.action !== selectedAction) {
        return false;
      }

      // Operator Filter
      if (selectedOperator !== 'All' && log.operatorName !== selectedOperator) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedAction, selectedOperator]);

  // Export logs to CSV
  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Action',
      'Entity Type',
      'Entity Name',
      'Operator Name',
      'Operator Role',
      'Details',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.action}"`,
      `"${log.entityType}"`,
      `"${log.entityName.replace(/"/g, '""')}"`,
      `"${log.operatorName.replace(/"/g, '""')}"`,
      `"${log.operatorRole}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `aceworld-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
              Operator CRUD & Sales Audit Log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable activity trail recording who created, modified, deleted items or completed sales.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log CSV</span>
          </button>

          {currentUser?.role === 'Admin' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear historical audit logs?')) {
                  clearLogs();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search audit trail by item name, cashier, SKU, or detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Operator Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Operator:
            </span>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Staff Members</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.name}>
                  {acc.name} ({acc.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-3">
          <button
            onClick={() => setSelectedAction('All')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedAction === 'All'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Actions ({auditLogs.length})
          </button>

          {(
            [
              'CREATE_ITEM',
              'UPDATE_ITEM',
              'DELETE_ITEM',
              'STOCK_ADJUSTMENT',
              'SALE_COMPLETED',
              'PRICE_OVERRIDE',
              'CREATE_USER',
              'UPDATE_USER',
              'DELETE_USER',
              'CREATE_CATEGORY',
              'DELETE_CATEGORY',
            ] as AuditAction[]
          ).map((action) => {
            const isSelected = selectedAction === action;
            const count = auditLogs.filter((l) => l.action === action).length;
            const conf = actionConfig[action];

            return (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{conf.label}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Log Entries Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <History className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            No audit records matched your filter
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Any future add, update, delete, stock adjust, or sale action will be captured here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const conf = actionConfig[log.action] || actionConfig.UPDATE_ITEM;
            const dateObj = new Date(log.timestamp);

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  
                  {/* Left: Action badge, Operator info & Entity */}
                  <div className="flex items-start gap-3">
                    
                    {/* Operator Avatar */}
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                      {log.operatorName.charAt(0)}
                    </div>

                    <div>
                      {/* Operator Identity & Action Tag */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {log.operatorName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ({log.operatorRole})
                        </span>
                        
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>

                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {conf.icon}
                          <span>{conf.label}</span>
                        </span>
                      </div>

                      {/* Affected Item / Entity Name */}
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-1">
                        {log.entityName}
                      </div>

                      {/* Description / Note */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {log.details}
                      </p>
                    </div>

                  </div>

                  {/* Right: Timestamp */}
                  <div className="text-right sm:shrink-0 text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                    <div>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <div className="text-[10px]">{dateObj.toLocaleDateString()}</div>
                  </div>

                </div>

                {/* Diff Viewer (if available) */}
                {log.diff && log.diff.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Recorded State Changes
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {log.diff.map((d, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs font-mono"
                        >
                          <div className="text-[10px] text-slate-500 uppercase">{d.field}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-rose-600 dark:text-rose-400 line-through truncate max-w-[100px]">
                              {String(d.from) || '(empty)'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[100px]">
                              {String(d.to)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
