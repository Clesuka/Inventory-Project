import React, { useState } from 'react';
import {
  X,
  Wrench,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Edit,
  Trash2,
  FileText,
  BadgeCheck,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShopAsset, ShopAssetStatus } from '../types';
import { formatIDR } from '../utils/formatters';

interface ShopAssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: ShopAsset | null;
  onEdit: (asset: ShopAsset) => void;
  onSell: (asset: ShopAsset) => void;
  onDelete: (asset: ShopAsset) => void;
}

export const ShopAssetDetailModal: React.FC<ShopAssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onSell,
  onDelete,
}) => {
  const { updateAssetStatus, currentUser } = useApp();
  const [statusNote, setStatusNote] = useState('');
  const [showStatusNoteInput, setShowStatusNoteInput] = useState(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<ShopAssetStatus | null>(null);

  if (!isOpen || !asset) return null;

  const isAdmin = currentUser?.role === 'Admin';
  const isSold = asset.status === 'SOLD';

  const handleApplyStatusChange = (newStatus: ShopAssetStatus) => {
    if (newStatus === asset.status) return;

    if (!showStatusNoteInput || selectedNextStatus !== newStatus) {
      setSelectedNextStatus(newStatus);
      setShowStatusNoteInput(true);
      return;
    }

    updateAssetStatus(asset.id, newStatus, statusNote.trim() || undefined);
    setStatusNote('');
    setShowStatusNoteInput(false);
    setSelectedNextStatus(null);
  };

  const getStatusBadge = (status: ShopAssetStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Active & Operational
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            In Use on Bench
          </span>
        );
      case 'ON_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            On Service / Repair
          </span>
        );
      case 'BROKEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Broken / Needs Attention
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Standby / Reserve
          </span>
        );
      case 'SOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <ShoppingBag className="w-3 h-3" />
            Sold / Liquidated
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {asset.assetTag}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {asset.category}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {asset.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {getStatusBadge(asset.status)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Sold Banner Highlight (if asset was sold) */}
          {isSold && asset.saleInfo && (
            <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Item Sold to Customer</span>
                </div>
                <div className="text-lg font-mono font-bold text-purple-900 dark:text-purple-200 tabular-nums">
                  {formatIDR(asset.saleInfo.soldPrice)}
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-800/80 dark:text-purple-300/80 flex items-center gap-3 flex-wrap">
                {asset.saleInfo.soldToCustomer && (
                  <span>Buyer: <strong>{asset.saleInfo.soldToCustomer}</strong></span>
                )}
                {asset.saleInfo.customerPhone && (
                  <span>Phone: {asset.saleInfo.customerPhone}</span>
                )}
                {asset.saleInfo.paymentMethod && (
                  <span>Payment: {asset.saleInfo.paymentMethod}</span>
                )}
                <span>Date: {new Date(asset.saleInfo.soldDate).toLocaleDateString()}</span>
                <span>Handled by: {asset.saleInfo.soldBy}</span>
              </div>
              {asset.saleInfo.notes && (
                <p className="mt-2 text-xs text-purple-900 dark:text-purple-300 italic border-t border-purple-200/60 dark:border-purple-800/40 pt-1.5">
                  "{asset.saleInfo.notes}"
                </p>
              )}
            </div>
          )}

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Manufacturer</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>{asset.brand}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Model / Spec</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {asset.model || 'Standard Tool'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Location</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>{asset.location}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Condition</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {asset.condition}
              </div>
            </div>
          </div>

          {/* Secondary Details: Serial Number, Station, Acquisition Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Serial Number
              </div>
              <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {asset.serialNumber || 'No S/N (Tray / Shop Gear)'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Assigned Station
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{asset.assignedTo || 'Shared Workshop Tool'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Acquisition Cost
              </div>
              <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {asset.purchaseCost !== undefined ? formatIDR(asset.purchaseCost) : 'Not recorded'}
              </div>
            </div>
          </div>

          {/* Quick Status Changer Bar (Only if not sold) */}
          {!isSold && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Update Equipment Status
                </span>
                <span className="text-[11px] text-slate-400">Click a status to update</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['ACTIVE', 'IN_USE', 'ON_SERVICE', 'BROKEN', 'STANDBY'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleApplyStatusChange(st)}
                    className={`px-2 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                      asset.status === st
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : selectedNextStatus === st
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st === 'ACTIVE' && 'Active'}
                    {st === 'IN_USE' && 'In Use'}
                    {st === 'ON_SERVICE' && 'On Service'}
                    {st === 'BROKEN' && 'Broken'}
                    {st === 'STANDBY' && 'Standby'}
                  </button>
                ))}
              </div>

              {showStatusNoteInput && selectedNextStatus && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Optional note for changing status to ${selectedNextStatus}...`}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyStatusChange(selectedNextStatus)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Confirm Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusNoteInput(false);
                        setSelectedNextStatus(null);
                        setStatusNote('');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Condition Notes & History */}
          {asset.notes && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Notes & Maintenance Log</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                {asset.notes}
              </p>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 flex-wrap gap-2">
            <span>Registered: {new Date(asset.createdAt).toLocaleString()}</span>
            <span>Last modified by: {asset.lastModifiedBy}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(asset)}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isSold && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSell(asset);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sell or liquidate this shop inventory tool"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Sell Asset</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(asset);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Specs</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
