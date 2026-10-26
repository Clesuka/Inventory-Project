import React, { useState } from 'react';
import { X, Plus, Minus, PackageCheck, AlertCircle } from 'lucide-react';
import { Item } from '../types';
import { useApp } from '../context/AppContext';

interface StockAdjustModalProps {
  item: Item | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ item, onClose }) => {
  const { currentUser, adjustStock } = useApp();

  const [stockValue, setStockValue] = useState<number>(item ? item.stock : 0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!item) return null;

  const currentStock = item.stock;
  const delta = stockValue - currentStock;

  const handleQuickAdd = (amount: number) => {
    setStockValue((prev) => Math.max(0, prev + amount));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      onClose();
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the stock adjustment (recorded in audit log)');
      return;
    }

    adjustStock(item.id, stockValue, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base leading-tight">
                Adjust Physical Stock
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {item.sku}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Component</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
              {item.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {item.brand} · {item.size} · Location: {item.location}
            </div>
          </div>

          {/* Stepper Display */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
              Current: <span className="font-mono font-bold text-slate-900 dark:text-white">{currentStock} units</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStockValue((prev) => Math.max(0, prev - 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-center font-mono font-bold text-2xl text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-1 focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => setStockValue((prev) => prev + 1)}
                className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
              >
                +25
              </button>
            </div>

            {/* Change indicator */}
            <div className="mt-3 text-xs font-mono font-medium">
              {delta > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Adjustment: +{delta} units (Receiving / Restock)
                </span>
              ) : delta < 0 ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Adjustment: {delta} units (Shrinkage / Write-off)
                </span>
              ) : (
                <span className="text-slate-400">No change in quantity</span>
              )}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
              Reason for Audit Log *
            </label>
            <input
              type="text"
              placeholder="e.g. Distributor shipment received, Inventory audit reconciliation, Damaged box"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Logged by: <strong className="text-slate-600 dark:text-slate-300">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || 'Staff'})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={delta === 0}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
