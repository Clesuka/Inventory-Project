import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Item } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';

interface DeleteConfirmModalProps {
  item: Item | null;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ item, onClose }) => {
  const { currentUser, deleteItem } = useApp();
  const [reason, setReason] = useState('');

  if (!item) return null;

  const handleDelete = () => {
    deleteItem(item.id, reason.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Remove Item from Inventory?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are about to delete <strong className="text-slate-900 dark:text-white">"{item.name}"</strong> ({item.sku}).
              This will remove all {item.stock} unit(s) from catalog availability.
            </p>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1 font-mono text-slate-600 dark:text-slate-300">
            <div>Brand: {item.brand}</div>
            <div>Category: {item.category}</div>
            <div>Stock: {item.stock} unit(s)</div>
            <div>Retail: {formatIDR(item.sellPrice)}</div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Reason for Deletion (Recorded in Audit Log)
            </label>
            <input
              type="text"
              placeholder="e.g. End of Life / Discontinued, Replaced by newer revision"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Logged by: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.name || 'Admin'}</strong> ({currentUser?.role || 'Admin'})
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
            >
              Delete Item
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
