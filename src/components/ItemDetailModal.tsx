import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Package,
  Layers,
  Calendar,
  Clock,
  User,
  SlidersHorizontal,
  DollarSign,
  Edit2,
  TrendingUp,
  Tag,
  MapPin,
  AlertTriangle,
  FileText,
  Plus,
  Minus,
  CheckCircle2,
  ShoppingCart,
  MessageSquare,
  History,
  ShieldCheck,
  ArrowRight,
  Filter,
  Barcode,
  Copy,
  Check,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Item, AuditLog, SaleRecord, ItemSerialNumber, SerialStatus, AuditFieldDiff } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onEditItem?: (item: Item) => void;
  onSendToPos?: (item: Item) => void;
}

type TimelineFilter = 'all' | 'stock' | 'edits' | 'sales' | 'notes';

interface UnifiedTimelineEvent {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'STOCK' | 'SALE' | 'NOTE' | 'DELETE';
  title: string;
  timestamp: string;
  operatorName: string;
  operatorRole?: string;
  details: string;
  diff?: AuditFieldDiff[];
  saleMeta?: {
    receiptNumber: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: string;
    customerName?: string;
  };
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item: initialItem,
  isOpen,
  onClose,
  onEditItem,
  onSendToPos,
}) => {
  const {
    items,
    auditLogs,
    sales,
    currentUser,
    adjustStock,
    addItemNote,
    addSerialNumbers,
    updateSerialStatus,
    deleteSerialNumber,
  } = useApp();
  const isAdmin = currentUser?.role === 'Admin';

  // Always use the latest item data from AppContext state
  const currentItem = useMemo(() => {
    if (!initialItem) return null;
    return items.find((i) => i.id === initialItem.id) || initialItem;
  }, [items, initialItem]);

  // Active sub-tool panel inside modal
  const [activeActionTab, setActiveActionTab] = useState<'timeline' | 'serials' | 'add_note' | 'adjust_stock'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');

  // Form states for in-modal actions
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const [stockQty, setStockQty] = useState<number>(0);
  const [stockReason, setStockReason] = useState('');
  const [stockError, setStockError] = useState('');

  // Serials management states
  const [serialBatchInput, setSerialBatchInput] = useState('');
  const [serialWarrantyMonths, setSerialWarrantyMonths] = useState<number>(36);
  const [serialFilter, setSerialFilter] = useState<'all' | 'in_stock' | 'sold' | 'rma' | 'defective'>('all');
  const [serialError, setSerialError] = useState('');
  const [isAddingSerials, setIsAddingSerials] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Sync initial stock value when item changes or modal opens
  useEffect(() => {
    if (currentItem) {
      setStockQty(currentItem.stock);
      setStockReason('');
      setStockError('');
      setNoteContent('');
      setNoteError('');
      setActionSuccessMsg('');
    }
  }, [currentItem?.id, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Unified item history combining direct audit logs + sales transactions
  const timelineEvents = useMemo<UnifiedTimelineEvent[]>(() => {
    if (!currentItem) return [];

    const events: UnifiedTimelineEvent[] = [];

    // 1. Direct Audit Logs for this item
    auditLogs.forEach((log) => {
      const isItemLog =
        log.entityId === currentItem.id ||
        (log.entityType === 'ITEM' && log.entityName.toLowerCase() === currentItem.name.toLowerCase());

      if (!isItemLog) return;

      let type: UnifiedTimelineEvent['type'] = 'UPDATE';
      let title = 'Catalog Updated';

      if (log.action === 'CREATE_ITEM') {
        type = 'CREATE';
        title = 'Component Added to Catalog';
      } else if (log.action === 'STOCK_ADJUSTMENT') {
        type = 'STOCK';
        title = 'Stock Quantity Adjusted';
      } else if (log.action === 'NOTE_ADDED') {
        type = 'NOTE';
        title = 'Operational Note Recorded';
      } else if (log.action === 'DELETE_ITEM') {
        type = 'DELETE';
        title = 'Component Removed';
      }

      events.push({
        id: log.id,
        type,
        title,
        timestamp: log.timestamp,
        operatorName: log.operatorName,
        operatorRole: log.operatorRole,
        details: log.details,
        diff: log.diff,
      });
    });

    // 2. Sales records containing this item
    sales.forEach((sale) => {
      const match = sale.items.find((si) => si.itemId === currentItem.id);
      if (match) {
        events.push({
          id: `sale-item-${sale.id}-${match.itemId}`,
          type: 'SALE',
          title: `Sold at Register (${sale.receiptNumber})`,
          timestamp: sale.timestamp,
          operatorName: sale.cashierName,
          operatorRole: sale.cashierRole,
          details: `Dispensed ${match.quantity} unit(s) at ${formatIDR(match.unitPrice)} each via ${sale.paymentMethod}${
            sale.customerName ? ` to customer "${sale.customerName}"` : ''
          }`,
          diff: [
            { field: 'unitsSold', from: 0, to: match.quantity },
            { field: 'lineTotal', from: 0, to: formatIDR(match.lineTotal) },
          ],
          saleMeta: {
            receiptNumber: sale.receiptNumber,
            quantity: match.quantity,
            unitPrice: match.unitPrice,
            paymentMethod: sale.paymentMethod,
            customerName: sale.customerName,
          },
        });
      }
    });

    // Sort newest to oldest
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [currentItem, auditLogs, sales]);

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    if (timelineFilter === 'all') return timelineEvents;
    if (timelineFilter === 'stock') return timelineEvents.filter((e) => e.type === 'STOCK');
    if (timelineFilter === 'edits') return timelineEvents.filter((e) => e.type === 'CREATE' || e.type === 'UPDATE');
    if (timelineFilter === 'sales') return timelineEvents.filter((e) => e.type === 'SALE');
    if (timelineFilter === 'notes') return timelineEvents.filter((e) => e.type === 'NOTE');
    return timelineEvents;
  }, [timelineEvents, timelineFilter]);

  if (!isOpen || !currentItem) return null;

  const isLowStock = currentItem.stock <= currentItem.minStockAlert && currentItem.stock > 0;
  const isOutOfStock = currentItem.stock === 0;

  // Margin calculation
  const profitMarginRp = currentItem.sellPrice - currentItem.buyPrice;
  const profitMarginPercent =
    currentItem.sellPrice > 0 ? ((profitMarginRp / currentItem.sellPrice) * 100).toFixed(1) : '0';

  // Quick Add Note Handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      setNoteError('Please enter a note before submitting.');
      return;
    }

    const res = addItemNote(currentItem.id, noteContent.trim());
    if (res.success) {
      setNoteContent('');
      setNoteError('');
      setActionSuccessMsg('Note successfully appended to item history log.');
      setTimeout(() => {
        setActionSuccessMsg('');
        setActiveActionTab('timeline');
        setTimelineFilter('notes');
      }, 1200);
    } else {
      setNoteError(res.error || 'Failed to add note.');
    }
  };

  // Quick Stock Adjustment Handler
  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const delta = stockQty - currentItem.stock;
    if (delta === 0) {
      setStockError('New stock quantity is identical to current stock.');
      return;
    }
    if (!stockReason.trim()) {
      setStockError('Please provide a reason or document reference for this stock change.');
      return;
    }

    adjustStock(currentItem.id, stockQty, stockReason.trim());
    setStockReason('');
    setStockError('');
    setActionSuccessMsg(`Stock updated to ${stockQty} units (${delta > 0 ? `+${delta}` : delta}).`);
    setTimeout(() => {
      setActionSuccessMsg('');
      setActiveActionTab('timeline');
      setTimelineFilter('stock');
    }, 1200);
  };

  // Batch Add Serials Handler
  const handleBatchAddSerials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialBatchInput.trim()) {
      setSerialError('Please enter at least one serial number.');
      return;
    }

    const rawList = serialBatchInput
      .split(/[\n,;\t]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (rawList.length === 0) {
      setSerialError('No valid serial numbers parsed.');
      return;
    }

    const res = addSerialNumbers(currentItem.id, rawList, serialWarrantyMonths);
    if (res.success) {
      setSerialBatchInput('');
      setSerialError('');
      setIsAddingSerials(false);
      setActionSuccessMsg(`Successfully registered ${res.added} serial numbers.`);
      setTimeout(() => setActionSuccessMsg(''), 2500);
    } else {
      setSerialError(res.error || 'Failed to add serial numbers.');
    }
  };

  const handleCopySerial = (sn: string) => {
    navigator.clipboard.writeText(sn);
    setCopiedSerial(sn);
    setTimeout(() => setCopiedSerial(null), 1500);
  };

  const itemSerials = useMemo(() => currentItem?.serialNumbers || [], [currentItem]);

  const filteredSerials = useMemo(() => {
    if (serialFilter === 'all') return itemSerials;
    if (serialFilter === 'in_stock') return itemSerials.filter((s) => s.status === 'IN_STOCK');
    if (serialFilter === 'sold') return itemSerials.filter((s) => s.status === 'SOLD');
    if (serialFilter === 'rma') return itemSerials.filter((s) => s.status === 'RMA_PENDING');
    if (serialFilter === 'defective') return itemSerials.filter((s) => s.status === 'DEFECTIVE');
    return itemSerials;
  }, [itemSerials, serialFilter]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
                  {currentItem.category}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  SKU: <strong className="text-slate-800 dark:text-slate-200">{currentItem.sku}</strong>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display truncate">
                {currentItem.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {/* Quick stock status pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-mono">
              {isOutOfStock ? (
                <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-0.5 rounded-full">
                  Out of Stock (0)
                </span>
              ) : isLowStock ? (
                <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {currentItem.stock} Low Stock
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {currentItem.stock} in Stock
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: Comprehensive Item Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Manufacturer</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span>{currentItem.brand}</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Specs / Form Factor</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {currentItem.size || 'Standard'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Variant / Color</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {currentItem.color || 'Default'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Bin / Warehouse Shelf</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>{currentItem.location || 'Main Floor'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Stock Inventory Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Retail Price */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase tracking-wider font-medium">
                <span>Retail Price</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatIDR(currentItem.sellPrice)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Selling price configured for POS register
              </div>
            </div>

            {/* Cost & Profit Margin */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase tracking-wider font-medium">
                <span>Cost Price</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatIDR(currentItem.buyPrice)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <span>Margin:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{profitMarginPercent}% ({formatIDR(profitMarginRp)})
                </span>
              </div>
            </div>

            {/* Stock Count */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase tracking-wider font-medium">
                <span>Physical Stock</span>
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
                <span>{currentItem.stock}</span>
                <span className="text-xs font-sans text-slate-400 font-normal">units available</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Min threshold alert at ≤ {currentItem.minStockAlert} units
              </div>
            </div>
          </div>

          {/* Section 3: Item Notes (if any configured) */}
          {currentItem.notes && (
            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Catalog Note: </strong>
                <span>{currentItem.notes}</span>
              </div>
            </div>
          )}

          {/* Section 4: Operational Action Toolbar */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap gap-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveActionTab('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeActionTab === 'timeline'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Activity Log ({timelineEvents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveActionTab('serials')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeActionTab === 'serials'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Serial Numbers ({itemSerials.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveActionTab('add_note')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeActionTab === 'add_note'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Add Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveActionTab('adjust_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeActionTab === 'adjust_stock'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Adjust Stock</span>
                </button>
              </div>

              {/* Success Banner */}
              {actionSuccessMsg && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Sub-Panel: Serial Numbers & Warranty Center */}
            {activeActionTab === 'serials' && (
              <div className="p-4 bg-white dark:bg-slate-900 space-y-4">
                {/* Serials Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Total Units</span>
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                      {itemSerials.length}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium uppercase">In Stock</span>
                    <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {itemSerials.filter((s) => s.status === 'IN_STOCK').length}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/40">
                    <span className="text-[10px] text-blue-700 dark:text-blue-400 font-medium uppercase">Sold</span>
                    <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                      {itemSerials.filter((s) => s.status === 'SOLD').length}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/40">
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 font-medium uppercase">Warranty Term</span>
                    <div className="text-lg font-bold font-mono text-purple-700 dark:text-purple-400 mt-0.5">
                      {currentItem.defaultWarrantyMonths || 12} Mos
                    </div>
                  </div>
                </div>

                {/* Batch Add Serials Toggle & Form */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-800/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <Barcode className="w-4 h-4 text-blue-600" />
                      <span>Intake / Register Serial Numbers</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingSerials(!isAddingSerials)}
                      className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingSerials ? 'Hide Intake Form' : 'Batch Register Serials'}</span>
                    </button>
                  </div>

                  {isAddingSerials && (
                    <form onSubmit={handleBatchAddSerials} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Scan or Paste Serial Numbers (one per line, or comma-separated)
                        </label>
                        <textarea
                          rows={3}
                          value={serialBatchInput}
                          onChange={(e) => {
                            setSerialBatchInput(e.target.value);
                            if (serialError) setSerialError('');
                          }}
                          placeholder={`e.g.\nSN-${currentItem.sku.slice(0, 8)}-1001\nSN-${currentItem.sku.slice(0, 8)}-1002`}
                          className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            Warranty Duration:
                          </label>
                          <select
                            value={serialWarrantyMonths}
                            onChange={(e) => setSerialWarrantyMonths(Number(e.target.value))}
                            className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                          >
                            <option value={12}>12 Months (1 Year)</option>
                            <option value={24}>24 Months (2 Years)</option>
                            <option value={36}>36 Months (3 Years)</option>
                            <option value={60}>60 Months (5 Years)</option>
                            <option value={120}>120 Months (10 Years / Lifetime)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingSerials(false);
                              setSerialBatchInput('');
                              setSerialError('');
                            }}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save to Inventory</span>
                          </button>
                        </div>
                      </div>

                      {serialError && <p className="text-xs text-rose-500">{serialError}</p>}
                    </form>
                  )}
                </div>

                {/* Serials Filter Pills */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { key: 'all', label: `All (${itemSerials.length})` },
                      { key: 'in_stock', label: `In Stock (${itemSerials.filter((s) => s.status === 'IN_STOCK').length})` },
                      { key: 'sold', label: `Sold (${itemSerials.filter((s) => s.status === 'SOLD').length})` },
                      { key: 'rma', label: `RMA (${itemSerials.filter((s) => s.status === 'RMA_PENDING').length})` },
                      { key: 'defective', label: `Defective (${itemSerials.filter((s) => s.status === 'DEFECTIVE').length})` },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSerialFilter(f.key as any)}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                          serialFilter === f.key
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Serials List */}
                {filteredSerials.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <Barcode className="w-8 h-8 mx-auto opacity-40 stroke-1" />
                    <p className="text-xs">No serial numbers found for this filter.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredSerials.map((sn) => {
                      const isSold = sn.status === 'SOLD';
                      const isInStock = sn.status === 'IN_STOCK';
                      const isRma = sn.status === 'RMA_PENDING';
                      const isDefective = sn.status === 'DEFECTIVE';

                      let expiryDaysText = '';
                      let isWarrantyActive = false;
                      if (sn.warrantyExpiryDate) {
                        const daysLeft = Math.ceil(
                          (new Date(sn.warrantyExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24)
                        );
                        if (daysLeft > 0) {
                          isWarrantyActive = true;
                          expiryDaysText = `${daysLeft} days left`;
                        } else {
                          expiryDaysText = `Expired ${Math.abs(daysLeft)} days ago`;
                        }
                      }

                      return (
                        <div
                          key={sn.id}
                          className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-3 flex-wrap"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {sn.serialNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopySerial(sn.serialNumber)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Copy S/N"
                              >
                                {copiedSerial === sn.serialNumber ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {/* Status Badge */}
                              {isInStock && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  In Stock
                                </span>
                              )}
                              {isSold && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                  Sold
                                </span>
                              )}
                              {isRma && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                  Under RMA
                                </span>
                              )}
                              {isDefective && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                  Defective
                                </span>
                              )}
                            </div>

                            {/* Additional metadata */}
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Garansi: {sn.warrantyMonths} Bln</span>
                              {sn.warrantyExpiryDate && (
                                <>
                                  <span>·</span>
                                  <span className={isWarrantyActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 font-medium'}>
                                    {expiryDaysText} (s/d {new Date(sn.warrantyExpiryDate).toLocaleDateString('id-ID')})
                                  </span>
                                </>
                              )}
                              {sn.saleReceiptNumber && (
                                <>
                                  <span>·</span>
                                  <span>Invoice: <strong className="text-slate-700 dark:text-slate-200">{sn.saleReceiptNumber}</strong></span>
                                </>
                              )}
                              {sn.customerName && (
                                <>
                                  <span>·</span>
                                  <span>Customer: {sn.customerName}</span>
                                </>
                              )}
                            </div>
                            {sn.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">Note: "{sn.notes}"</p>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {isInStock && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateSerialStatus(currentItem.id, sn.id, 'DEFECTIVE', 'Flagged as defective in inventory inspection')}
                                  className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                                  title="Mark unit as defective"
                                >
                                  Mark Defective
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSerialNumber(currentItem.id, sn.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                                  title="Delete serial"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {isDefective && (
                              <button
                                type="button"
                                onClick={() => updateSerialStatus(currentItem.id, sn.id, 'IN_STOCK', 'Restored to in-stock after re-testing')}
                                className="px-2.5 py-1 text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded font-medium cursor-pointer"
                              >
                                Restore to In-Stock
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Panel: Add Note Form */}
            {activeActionTab === 'add_note' && (
              <form onSubmit={handleAddNote} className="p-4 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Record Operational Note / Remark
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Signed by {currentUser?.name} ({currentUser?.role})
                  </span>
                </div>
                <textarea
                  value={noteContent}
                  onChange={(e) => {
                    setNoteContent(e.target.value);
                    if (noteError) setNoteError('');
                  }}
                  rows={3}
                  placeholder="e.g. Verified warranty seal with distributor; moved 5 units to front display showcase shelf A2."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {noteError && <p className="text-xs text-rose-500">{noteError}</p>}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionTab('timeline');
                      setNoteContent('');
                      setNoteError('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Save Note to History</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-Panel: Adjust Stock Form */}
            {activeActionTab === 'adjust_stock' && (
              <form onSubmit={handleAdjustStock} className="p-4 bg-white dark:bg-slate-900 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stock Quantity Controls */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                      New Physical Stock Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStockQty((q) => Math.max(0, q - 1))}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={stockQty}
                        onChange={(e) => setStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-24 text-center py-1.5 text-sm font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setStockQty((q) => q + 1)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <div className="text-xs font-mono ml-2">
                        {stockQty - currentItem.stock !== 0 && (
                          <span
                            className={
                              stockQty > currentItem.stock
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-rose-600 dark:text-rose-400 font-semibold'
                            }
                          >
                            {stockQty > currentItem.stock
                              ? `(+${stockQty - currentItem.stock})`
                              : `(${stockQty - currentItem.stock})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                      Adjustment Reason / Reference
                    </label>
                    <input
                      type="text"
                      value={stockReason}
                      onChange={(e) => {
                        setStockReason(e.target.value);
                        if (stockError) setStockError('');
                      }}
                      placeholder="e.g. PO #8891 restock, damaged return, cycle count"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {stockError && <p className="text-xs text-rose-500">{stockError}</p>}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionTab('timeline');
                      setStockQty(currentItem.stock);
                      setStockReason('');
                      setStockError('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Apply Adjustment</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-Panel: Timeline View */}
            {activeActionTab === 'timeline' && (
              <div className="p-4 bg-white dark:bg-slate-900">
                {/* Timeline Filter Pills */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">Filter History:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {(
                      [
                        { key: 'all', label: 'All Events' },
                        { key: 'stock', label: 'Stock Changes' },
                        { key: 'sales', label: 'Sales Records' },
                        { key: 'edits', label: 'Catalog Edits' },
                        { key: 'notes', label: 'Staff Notes' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setTimelineFilter(f.key)}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                          timelineFilter === f.key
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeline List */}
                {filteredEvents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No activity entries match the selected filter.</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {filteredEvents.map((evt) => {
                      const dateObj = new Date(evt.timestamp);
                      const formattedTime = dateObj.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const formattedDate = dateObj.toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      // Node icon & color by event type
                      let dotColor = 'bg-blue-500';
                      let badgeClasses = 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40';

                      if (evt.type === 'STOCK') {
                        dotColor = 'bg-indigo-500';
                        badgeClasses = 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40';
                      } else if (evt.type === 'SALE') {
                        dotColor = 'bg-emerald-500';
                        badgeClasses = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40';
                      } else if (evt.type === 'NOTE') {
                        dotColor = 'bg-amber-500';
                        badgeClasses = 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40';
                      } else if (evt.type === 'DELETE') {
                        dotColor = 'bg-rose-500';
                        badgeClasses = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40';
                      }

                      return (
                        <div key={evt.id} className="relative group">
                          {/* Dot marker */}
                          <div
                            className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`}
                          />

                          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800">
                            {/* Card header */}
                            <div className="flex items-center justify-between flex-wrap gap-1 text-[11px] mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded font-medium border text-[10px] uppercase tracking-wider ${badgeClasses}`}
                                >
                                  {evt.type}
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {evt.title}
                                </span>
                              </div>

                              <div className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formattedDate}</span>
                                <span>·</span>
                                <span>{formattedTime}</span>
                              </div>
                            </div>

                            {/* Details text */}
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                              {evt.details}
                            </p>

                            {/* Diff fields if present */}
                            {evt.diff && evt.diff.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-1.5">
                                {evt.diff.map((d, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                                  >
                                    <span className="text-slate-400">{d.field}:</span>
                                    <span className="line-through text-slate-400">{String(d.from)}</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                                    <span className="font-bold text-slate-900 dark:text-white">{String(d.to)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Operator signature */}
                            <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              <span>Logged by:</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {evt.operatorName}
                              </span>
                              {evt.operatorRole && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-[9px] uppercase font-mono">
                                  {evt.operatorRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Metadata Footer */}
          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              Item ID: <span className="text-slate-500 dark:text-slate-400">{currentItem.id}</span>
            </div>
            <div>
              Created: {new Date(currentItem.createdAt).toLocaleDateString()} · Last Modified:{' '}
              {new Date(currentItem.updatedAt).toLocaleDateString()} by{' '}
              <span className="text-slate-700 dark:text-slate-300">{currentItem.lastModifiedBy}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {onEditItem && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditItem(currentItem);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Item</span>
              </button>
            )}

            {onSendToPos && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSendToPos(currentItem);
                }}
                disabled={currentItem.stock === 0}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Open in Register (POS)</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
