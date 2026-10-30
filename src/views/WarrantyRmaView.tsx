import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Package,
  Wrench,
  Receipt,
  User,
  Phone,
  Barcode,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  X,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RmaRecord, RmaStatus, ItemSerialNumber, Item, SaleRecord } from '../types';
import { formatIDR } from '../utils/formatters';

interface WarrantyRmaViewProps {
  onOpenReceipt?: (sale: SaleRecord) => void;
}

export const WarrantyRmaView: React.FC<WarrantyRmaViewProps> = ({ onOpenReceipt }) => {
  const {
    items,
    rmas,
    sales,
    currentUser,
    lookupSerial,
    createRma,
    resolveRma,
  } = useApp();

  const isAdmin = currentUser?.role === 'Admin';

  // Hero Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [activeLookupResult, setActiveLookupResult] = useState<{
    searched: boolean;
    query: string;
    serial?: ItemSerialNumber;
    item?: Item;
    sale?: SaleRecord;
    rma?: RmaRecord;
  }>({
    searched: false,
    query: '',
  });

  // Filter state for RMA claims list
  const [rmaStatusFilter, setRmaStatusFilter] = useState<'all' | 'pending' | 'vendor' | 'resolved' | 'rejected'>('all');
  const [rmaSearchTerm, setRmaSearchTerm] = useState('');

  // Modals state
  const [isNewRmaModalOpen, setIsNewRmaModalOpen] = useState(false);
  const [newRmaSerial, setNewRmaSerial] = useState('');
  const [newRmaIssue, setNewRmaIssue] = useState('');
  const [newRmaCustomer, setNewRmaCustomer] = useState('');
  const [newRmaPhone, setNewRmaPhone] = useState('');
  const [newRmaStatus, setNewRmaStatus] = useState<RmaStatus>('PENDING_REVIEW');
  const [newRmaNotes, setNewRmaNotes] = useState('');
  const [newRmaError, setNewRmaError] = useState('');

  // Resolution modal state
  const [resolvingRma, setResolvingRma] = useState<RmaRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'REPLACEMENT' | 'REFUND' | 'REPAIR' | 'REJECT'>('REPLACEMENT');
  const [resolutionStatus, setResolutionStatus] = useState<RmaStatus>('REPLACED_FROM_STOCK');
  const [selectedReplacementSerialId, setSelectedReplacementSerialId] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionError, setResolutionError] = useState('');

  // Success message toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Perform S/N Verification
  const handlePerformLookup = (queryOverride?: string) => {
    const q = (queryOverride !== undefined ? queryOverride : lookupQuery).trim();
    if (!q) {
      setActiveLookupResult({ searched: false, query: '' });
      return;
    }

    const res = lookupSerial(q);
    setActiveLookupResult({
      searched: true,
      query: q,
      serial: res.serial,
      item: res.item,
      sale: res.sale,
      rma: res.rma,
    });
  };

  // Global counts
  const totalSerialsCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.serialNumbers?.length || 0), 0);
  }, [items]);

  const activeWarrantyCount = useMemo(() => {
    let count = 0;
    const now = Date.now();
    items.forEach((it) => {
      it.serialNumbers?.forEach((sn) => {
        if (sn.status === 'SOLD' && sn.warrantyExpiryDate) {
          if (new Date(sn.warrantyExpiryDate).getTime() > now) {
            count++;
          }
        }
      });
    });
    return count;
  }, [items]);

  const openRmaCount = useMemo(() => {
    return rmas.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'SENT_TO_VENDOR').length;
  }, [rmas]);

  const resolvedRmaCount = useMemo(() => {
    return rmas.filter(
      (r) =>
        r.status === 'REPLACED_FROM_STOCK' ||
        r.status === 'REPAIRED' ||
        r.status === 'REFUNDED'
    ).length;
  }, [rmas]);

  // Filtered RMA Claims
  const filteredRmas = useMemo(() => {
    return rmas.filter((rma) => {
      // Status filter
      if (rmaStatusFilter === 'pending' && rma.status !== 'PENDING_REVIEW') return false;
      if (rmaStatusFilter === 'vendor' && rma.status !== 'SENT_TO_VENDOR') return false;
      if (
        rmaStatusFilter === 'resolved' &&
        rma.status !== 'REPLACED_FROM_STOCK' &&
        rma.status !== 'REPAIRED' &&
        rma.status !== 'REFUNDED'
      )
        return false;
      if (rmaStatusFilter === 'rejected' && rma.status !== 'REJECTED') return false;

      // Search term
      if (rmaSearchTerm.trim()) {
        const q = rmaSearchTerm.toLowerCase();
        const matchNum = rma.rmaNumber.toLowerCase().includes(q);
        const matchSn = rma.serialNumber.toLowerCase().includes(q);
        const matchCust = rma.customerName.toLowerCase().includes(q);
        const matchItem = rma.itemName.toLowerCase().includes(q);
        const matchIssue = rma.issueDescription.toLowerCase().includes(q);
        if (!matchNum && !matchSn && !matchCust && !matchItem && !matchIssue) {
          return false;
        }
      }

      return true;
    });
  }, [rmas, rmaStatusFilter, rmaSearchTerm]);

  // Available in-stock serials for the item being resolved with replacement
  const replacementCandidateSerials = useMemo(() => {
    if (!resolvingRma) return [];
    const targetItem = items.find((i) => i.id === resolvingRma.itemId);
    if (!targetItem) return [];
    return (targetItem.serialNumbers || []).filter(
      (s) => s.status === 'IN_STOCK' && s.serialNumber.toUpperCase() !== resolvingRma.serialNumber.toUpperCase()
    );
  }, [resolvingRma, items]);

  // Handle open New RMA Modal from verified lookup
  const handleInitiateRmaFromLookup = () => {
    if (!activeLookupResult.serial || !activeLookupResult.item) return;
    setNewRmaSerial(activeLookupResult.serial.serialNumber);
    setNewRmaCustomer(activeLookupResult.serial.customerName || '');
    setNewRmaPhone(activeLookupResult.serial.customerPhone || '');
    setNewRmaIssue('');
    setNewRmaNotes('');
    setNewRmaError('');
    setIsNewRmaModalOpen(true);
  };

  // Submit New RMA Claim
  const handleCreateRmaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRmaSerial.trim()) {
      setNewRmaError('Serial number is required.');
      return;
    }
    if (!newRmaCustomer.trim()) {
      setNewRmaError('Customer name is required.');
      return;
    }
    if (!newRmaIssue.trim()) {
      setNewRmaError('Please describe the reported defect or symptoms.');
      return;
    }

    const res = createRma({
      serialNumber: newRmaSerial.trim(),
      customerName: newRmaCustomer.trim(),
      customerPhone: newRmaPhone.trim() || undefined,
      issueDescription: newRmaIssue.trim(),
      initialStatus: newRmaStatus,
      notes: newRmaNotes.trim() || undefined,
    });

    if (res.success && res.rma) {
      setIsNewRmaModalOpen(false);
      showToast(`RMA ticket ${res.rma.rmaNumber} successfully created.`);
      // Refresh lookup if was on same item
      if (activeLookupResult.query.toUpperCase() === newRmaSerial.trim().toUpperCase()) {
        handlePerformLookup(newRmaSerial.trim());
      }
    } else {
      setNewRmaError(res.error || 'Failed to file RMA claim.');
    }
  };

  // Open Resolve Modal
  const handleOpenResolveModal = (rma: RmaRecord) => {
    setResolvingRma(rma);
    setResolutionAction('REPLACEMENT');
    setResolutionStatus('REPLACED_FROM_STOCK');
    setSelectedReplacementSerialId('');
    setRefundAmount(0);
    setResolutionNotes('');
    setResolutionError('');
  };

  // Submit RMA Resolution
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRma) return;

    if (resolutionAction === 'REPLACEMENT') {
      if (!selectedReplacementSerialId) {
        setResolutionError('Please select a replacement serial number from in-stock inventory.');
        return;
      }
    }

    const chosenSerialObj = replacementCandidateSerials.find((s) => s.id === selectedReplacementSerialId);

    let nextStatus: RmaStatus = 'REPLACED_FROM_STOCK';
    if (resolutionAction === 'REFUND') nextStatus = 'REFUNDED';
    if (resolutionAction === 'REPAIR') nextStatus = 'REPAIRED';
    if (resolutionAction === 'REJECT') nextStatus = 'REJECTED';

    const res = resolveRma(resolvingRma.id, {
      status: nextStatus,
      actionTaken: resolutionAction,
      replacementSerialId: chosenSerialObj?.id,
      replacementSerialNumber: chosenSerialObj?.serialNumber,
      refundAmount: resolutionAction === 'REFUND' ? refundAmount : undefined,
      notes: resolutionNotes.trim() || undefined,
    });

    if (res.success) {
      showToast(`RMA ${resolvingRma.rmaNumber} has been resolved (${resolutionAction}).`);
      setResolvingRma(null);
      // Refresh active lookup if relevant
      if (activeLookupResult.query) {
        handlePerformLookup(activeLookupResult.query);
      }
    } else {
      setResolutionError(res.error || 'Failed to resolve RMA claim.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Tracked Hardware</span>
            <Barcode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalSerialsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Unique unit serials logged</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Active Warranties</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {activeWarrantyCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sold units under coverage</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Open RMA Claims</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {openRmaCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending review / vendor</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-medium tracking-wider">Resolved RMAs</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {resolvedRmaCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Replacements & refunds done</div>
        </div>
      </div>

      {/* HERO SECTION: Universal Serial Number Live Verification Terminal */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <h2 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-white">
              Hardware Warranty & Serial Verification Portal
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
            Scan barcode or type any component serial number to verify distributor authenticity, check active warranty days remaining, view original purchase invoice, and process customer RMA tickets.
          </p>

          {/* Quick search input */}
          <div className="flex gap-2 flex-col sm:flex-row pt-1">
            <div className="relative flex-1">
              <Barcode className="absolute inset-y-0 left-0 pl-3.5 my-auto w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePerformLookup();
                  }
                }}
                placeholder="Scan or enter S/N (e.g. SN-ROG4080S-88101, SN-ROG4080S-87995)..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder:text-blue-200/60 font-mono text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:bg-white/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePerformLookup()}
                className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Verify Warranty</span>
              </button>
              {lookupQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLookupQuery('');
                    setActiveLookupResult({ searched: false, query: '' });
                  }}
                  className="px-3 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick chip demo shortcuts */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-blue-200/70">
            <span>Quick Test S/N:</span>
            {[
              'SN-ROG4080S-87990',
              'SN-ROG4080S-87995',
              'SN-ROG4080S-88101',
              'SN-GBB650I-1902',
              'SN-AMD78X3D-9201',
            ].map((demoSn) => (
              <button
                key={demoSn}
                type="button"
                onClick={() => {
                  setLookupQuery(demoSn);
                  handlePerformLookup(demoSn);
                }}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/25 text-white font-mono cursor-pointer transition-colors"
              >
                {demoSn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LOOKUP RESULT DISPLAY CARD */}
      {activeLookupResult.searched && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {!activeLookupResult.serial ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Serial Number Not Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No matching hardware unit with S/N "
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  {activeLookupResult.query}
                </strong>
                " was found in Ace World Computer official inventory records.
              </p>
            </div>
          ) : (
            <div>
              {/* Top Banner with Warranty Status */}
              {(() => {
                const sn = activeLookupResult.serial;
                const item = activeLookupResult.item;
                const sale = activeLookupResult.sale;
                const rma = activeLookupResult.rma;

                let isExpired = false;
                let daysLeft = 0;
                if (sn.warrantyExpiryDate) {
                  daysLeft = Math.ceil(
                    (new Date(sn.warrantyExpiryDate).getTime() - Date.now()) / (1000 * 3600 * 24)
                  );
                  isExpired = daysLeft <= 0;
                }

                return (
                  <div className="space-y-4">
                    {/* Status Pill Bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          S/N: {sn.serialNumber}
                        </span>

                        {sn.status === 'IN_STOCK' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            IN STOCK · READY FOR SALE
                          </span>
                        )}

                        {sn.status === 'SOLD' && (
                          <>
                            {isExpired ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                WARRANTY EXPIRED ({Math.abs(daysLeft)} days ago)
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                ACTIVE WARRANTY · {daysLeft} DAYS REMAINING
                              </span>
                            )}
                          </>
                        )}

                        {sn.status === 'RMA_PENDING' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" />
                            ACTIVE RMA CLAIM IN PROGRESS
                          </span>
                        )}

                        {sn.status === 'DEFECTIVE' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            MARKED DEFECTIVE
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {sn.status === 'SOLD' && !rma && (
                          <button
                            type="button"
                            onClick={handleInitiateRmaFromLookup}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Initiate RMA Claim</span>
                          </button>
                        )}

                        {sale && onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(sale)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>View Sale Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* 1. Hardware Specs */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-blue-500" />
                          <span>Component Details</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item?.name}
                        </h4>
                        <div className="space-y-1 text-slate-600 dark:text-slate-400 font-mono">
                          <div>Manufacturer: <strong className="text-slate-800 dark:text-slate-200">{item?.brand}</strong></div>
                          <div>Category: <strong className="text-slate-800 dark:text-slate-200">{item?.category}</strong></div>
                          <div>SKU: <strong className="text-slate-800 dark:text-slate-200">{item?.sku}</strong></div>
                          <div>Catalog Price: <strong className="text-slate-800 dark:text-slate-200">{formatIDR(item?.sellPrice || 0)}</strong></div>
                        </div>
                      </div>

                      {/* 2. Warranty Terms */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Warranty Terms</span>
                        </div>
                        <div className="space-y-1 text-slate-600 dark:text-slate-400">
                          <div>
                            Distributor Coverage: <strong className="text-slate-900 dark:text-white font-bold">{sn.warrantyMonths} Months</strong>
                          </div>
                          <div>
                            Registered Into Stock: <strong>{new Date(sn.purchaseDate).toLocaleDateString('id-ID')}</strong>
                          </div>
                          {sn.soldDate && (
                            <div>
                              Sold Date: <strong>{new Date(sn.soldDate).toLocaleDateString('id-ID')}</strong>
                            </div>
                          )}
                          {sn.warrantyExpiryDate && (
                            <div>
                              Coverage Expiration: <strong className={isExpired ? 'text-rose-600 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                                {new Date(sn.warrantyExpiryDate).toLocaleDateString('id-ID')}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Sale & Customer Link */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Purchase & Ownership</span>
                        </div>
                        {sn.saleReceiptNumber ? (
                          <div className="space-y-1 text-slate-600 dark:text-slate-400">
                            <div>
                              Receipt No: <strong className="font-mono text-blue-600 dark:text-blue-400">{sn.saleReceiptNumber}</strong>
                            </div>
                            <div>
                              Customer Name: <strong className="text-slate-800 dark:text-slate-200">{sn.customerName || 'Walk-in Retail Guest'}</strong>
                            </div>
                            {sn.customerPhone && (
                              <div>Phone: <strong className="font-mono">{sn.customerPhone}</strong></div>
                            )}
                            {sale && (
                              <div>Cashier: {sale.cashierName} ({sale.paymentMethod})</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic py-2">
                            This unit has not been sold yet. Still resting in store inventory bin: <strong>{item?.location}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RMA Ticket Notice if active */}
                    {rma && (
                      <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <span className="font-bold text-purple-950 dark:text-purple-200">
                              Active Claim Ticket #{rma.rmaNumber}
                            </span>
                            <span className="text-purple-700 dark:text-purple-300 ml-2">
                              Reported: {new Date(rma.reportedAt).toLocaleDateString('id-ID')} · Status: {rma.status}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenResolveModal(rma)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer"
                        >
                          Process Ticket
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RMA CLAIMS MANAGEMENT REGISTRY */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>RMA Claims & Repair Registry</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track customer defective hardware returns, distributor warranty service, and replacement units.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewRmaSerial('');
                setNewRmaCustomer('');
                setNewRmaPhone('');
                setNewRmaIssue('');
                setNewRmaNotes('');
                setNewRmaError('');
                setIsNewRmaModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File New RMA Claim</span>
            </button>
          </div>
        </div>

        {/* Filters and search toolbar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: `All Claims (${rmas.length})` },
              { key: 'pending', label: `Pending Review (${rmas.filter((r) => r.status === 'PENDING_REVIEW').length})` },
              { key: 'vendor', label: `Sent to Vendor (${rmas.filter((r) => r.status === 'SENT_TO_VENDOR').length})` },
              { key: 'resolved', label: `Resolved (${rmas.filter((r) => r.status === 'REPLACED_FROM_STOCK' || r.status === 'REPAIRED' || r.status === 'REFUNDED').length})` },
              { key: 'rejected', label: `Rejected (${rmas.filter((r) => r.status === 'REJECTED').length})` },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setRmaStatusFilter(f.key as any)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                  rmaStatusFilter === f.key
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute inset-y-0 left-0 pl-3 my-auto w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={rmaSearchTerm}
              onChange={(e) => setRmaSearchTerm(e.target.value)}
              placeholder="Filter by RMA #, S/N, or customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* RMA Table */}
        {filteredRmas.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Wrench className="w-10 h-10 mx-auto stroke-1 opacity-40" />
            <p className="text-xs">No RMA claims match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-semibold bg-white dark:bg-slate-900">
                  <th className="py-3 px-4">RMA Number</th>
                  <th className="py-3 px-4">Component & S/N</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reported Issue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRmas.map((rma) => {
                  const isResolved =
                    rma.status === 'REPLACED_FROM_STOCK' ||
                    rma.status === 'REPAIRED' ||
                    rma.status === 'REFUNDED';

                  return (
                    <tr
                      key={rma.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* RMA Number & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {rma.rmaNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(rma.reportedAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* Component & Serial */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {rma.itemName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>S/N: <strong>{rma.serialNumber}</strong></span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {rma.customerName}
                        </div>
                        {rma.customerPhone && (
                          <div className="text-[10px] font-mono text-slate-400">
                            {rma.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Issue description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600 dark:text-slate-400 text-[11px]">
                          {rma.issueDescription}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rma.status === 'PENDING_REVIEW' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Pending Review
                          </span>
                        )}
                        {rma.status === 'SENT_TO_VENDOR' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            Sent to Vendor
                          </span>
                        )}
                        {rma.status === 'REPLACED_FROM_STOCK' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Replaced
                          </span>
                        )}
                        {rma.status === 'REFUNDED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                            Refunded
                          </span>
                        )}
                        {rma.status === 'REPAIRED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                            Repaired
                          </span>
                        )}
                        {rma.status === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Resolution Meta */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 min-w-[160px]">
                        {isResolved ? (
                          <div>
                            {rma.replacementSerialNumber && (
                              <div className="font-mono text-emerald-600 dark:text-emerald-400">
                                New S/N: {rma.replacementSerialNumber}
                              </div>
                            )}
                            {rma.refundAmount ? (
                              <div className="font-mono text-blue-600">
                                Refund: {formatIDR(rma.refundAmount)}
                              </div>
                            ) : null}
                            {rma.resolvedAt && (
                              <div className="text-[10px] text-slate-400">
                                Closed: {new Date(rma.resolvedAt).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">In progress by {rma.handledBy}</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenResolveModal(rma)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          {isResolved ? 'View Details' : 'Resolve Claim'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FILE NEW RMA CLAIM */}
      {isNewRmaModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  File Warranty RMA Claim Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRmaModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRmaSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Component Serial Number (S/N) *
                </label>
                <input
                  type="text"
                  required
                  value={newRmaSerial}
                  onChange={(e) => {
                    const sn = e.target.value.toUpperCase();
                    setNewRmaSerial(sn);
                    // auto-fill customer if found
                    const lookup = lookupSerial(sn);
                    if (lookup.serial?.customerName && !newRmaCustomer) {
                      setNewRmaCustomer(lookup.serial.customerName);
                      setNewRmaPhone(lookup.serial.customerPhone || '');
                    }
                  }}
                  placeholder="e.g. SN-ROG4080S-87995"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRmaCustomer}
                    onChange={(e) => setNewRmaCustomer(e.target.value)}
                    placeholder="e.g. Kevin Pratama"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={newRmaPhone}
                    onChange={(e) => setNewRmaPhone(e.target.value)}
                    placeholder="e.g. 08123456789"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Defect Description & Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newRmaIssue}
                  onChange={(e) => setNewRmaIssue(e.target.value)}
                  placeholder="Detailed failure notes, e.g. artifacts on DisplayPort, sudden reboot after 15 minutes 3D gaming load, no display on motherboard..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Initial Ticket Status
                </label>
                <select
                  value={newRmaStatus}
                  onChange={(e) => setNewRmaStatus(e.target.value as RmaStatus)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  <option value="PENDING_REVIEW">Pending Store Technician Review</option>
                  <option value="SENT_TO_VENDOR">Handed Over to Authorized Distributor / Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Additional Internal Remarks
                </label>
                <input
                  type="text"
                  value={newRmaNotes}
                  onChange={(e) => setNewRmaNotes(e.target.value)}
                  placeholder="e.g. Vendor RMA tracking #ASR-JKT-9982, original retail box included"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {newRmaError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newRmaError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRmaModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>File Claim Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE RMA CLAIM */}
      {resolvingRma && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Process RMA #{resolvingRma.rmaNumber}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Unit S/N: {resolvingRma.serialNumber} · {resolvingRma.itemName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolvingRma(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4">
              {/* Claim Summary Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div>Customer: <strong className="text-slate-900 dark:text-white">{resolvingRma.customerName}</strong> ({resolvingRma.customerPhone || 'No phone'})</div>
                <div>Issue: <span className="italic text-slate-600 dark:text-slate-400">"{resolvingRma.issueDescription}"</span></div>
                <div>Current Status: <strong className="text-blue-600">{resolvingRma.status}</strong></div>
              </div>

              {/* Resolution Action Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Action Taken / Resolution Method *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'REPLACEMENT', label: '1-to-1 Replacement', desc: 'Issue new unit from in-stock inventory' },
                    { key: 'REPAIR', label: 'Repaired by Vendor', desc: 'Fixed & returned to customer' },
                    { key: 'REFUND', label: 'Customer Refund', desc: 'Credit / refund purchase cost' },
                    { key: 'REJECT', label: 'Reject Claim', desc: 'Voided warranty / physical damage' },
                  ].map((act) => (
                    <button
                      key={act.key}
                      type="button"
                      onClick={() => setResolutionAction(act.key as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        resolutionAction === act.key
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-semibold">{act.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{act.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Specific Fields */}
              {resolutionAction === 'REPLACEMENT' && (
                <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs">
                  <label className="block font-semibold text-blue-950 dark:text-blue-200">
                    Select Replacement Serial Number from Stock *
                  </label>
                  {replacementCandidateSerials.length === 0 ? (
                    <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs">
                      No other units of this SKU are currently in stock! Please adjust stock or choose Refund instead.
                    </div>
                  ) : (
                    <select
                      value={selectedReplacementSerialId}
                      onChange={(e) => setSelectedReplacementSerialId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                    >
                      <option value="">-- Choose in-stock unit S/N ({replacementCandidateSerials.length} available) --</option>
                      {replacementCandidateSerials.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.serialNumber} (Warranty: {s.warrantyMonths} Mos)
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Selecting a replacement unit automatically marks it as SOLD with customer warranty transfer, and flags the defective unit as DEFECTIVE.
                  </p>
                </div>
              )}

              {resolutionAction === 'REFUND' && (
                <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs">
                  <label className="block font-semibold text-blue-950 dark:text-blue-200">
                    Refund Amount (IDR)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    placeholder="e.g. 18200000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-500">
                    Formatted: {formatIDR(refundAmount)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Resolution Notes / Sign-off Remarks
                </label>
                <textarea
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Verified customer exchange at front counter. Unit tested OK under Heaven Benchmark."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {resolutionError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resolutionError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingRma(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Close Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
