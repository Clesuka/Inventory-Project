import React, { useState } from 'react';
import { X, DollarSign, CheckCircle, ShoppingCart, User, Phone, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShopAsset } from '../types';
import { formatIDR } from '../utils/formatters';

interface SellAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ShopAsset | null;
  onSendToPos?: (asset: ShopAsset, sellingPrice: number) => void;
}

export const SellAssetModal: React.FC<SellAssetModalProps> = ({
  isOpen,
  onClose,
  asset,
  onSendToPos,
}) => {
  const { sellShopAsset } = useApp();

  const [soldPrice, setSoldPrice] = useState<number | ''>(
    asset?.purchaseCost ? Math.round(asset.purchaseCost * 0.8) : ''
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Bank Transfer' | 'Debit Card'>('Cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !asset) return null;

  const handleDirectSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (soldPrice === '' || Number(soldPrice) < 0) {
      setError('Please enter a valid selling price (0 or greater).');
      return;
    }

    const res = sellShopAsset(asset.id, {
      soldPrice: Number(soldPrice),
      soldToCustomer: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to record sale.');
    }
  };

  const handleTransferToPos = () => {
    if (soldPrice === '' || Number(soldPrice) < 0) {
      setError('Please specify a valid selling price before sending to POS register.');
      return;
    }

    if (onSendToPos) {
      onSendToPos(asset, Number(soldPrice));
      onClose();
    }
  };

  const cost = asset.purchaseCost || 0;
  const numPrice = soldPrice === '' ? 0 : Number(soldPrice);
  const diff = numPrice - cost;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
                Sell Shop Inventory Asset
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liquidate or sell workshop gear to a customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleDirectSale} className="p-6 space-y-4">
          
          {/* Target Asset Card Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  {asset.assetTag}
                </span>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                  {asset.name}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span>{asset.brand}</span>
                  {asset.model && (
                    <>
                      <span>·</span>
                      <span>{asset.model}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{asset.location}</span>
                </div>
              </div>
              {asset.purchaseCost !== undefined && (
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400">Orig. Cost</div>
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatIDR(asset.purchaseCost)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Agreed Selling Price (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">Rp</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={soldPrice}
                onChange={(e) => {
                  setError('');
                  setSoldPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)));
                }}
                className="w-full pl-9 pr-3 py-2 text-base font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {cost > 0 && numPrice > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Recovery vs Cost:</span>
                <span className={diff >= 0 ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  {diff >= 0 ? `+${formatIDR(diff)} profit` : `${formatIDR(Math.abs(diff))} depreciation`}
                </span>
              </div>
            )}
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Customer / Buyer Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Doe, Walk-in"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Customer Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 08123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Cash', 'QRIS', 'Bank Transfer', 'Debit Card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2 text-xs rounded-lg font-medium transition-colors cursor-pointer border text-center ${
                    paymentMethod === method
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Sale Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Sale Notes / Condition Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Sold as-is with original power supply and USB cable, 7-day personal testing warranty."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Choice Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {onSendToPos && (
                  <button
                    type="button"
                    onClick={handleTransferToPos}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Send item directly to POS Terminal to checkout and print full store receipt"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                    <span>Send to POS Register</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm shadow-purple-500/25 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Mark as Sold</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Status will transition to <strong className="text-purple-600 dark:text-purple-400">SOLD</strong> and be recorded in the audit trail.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
