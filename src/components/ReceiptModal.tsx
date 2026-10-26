import React, { useState } from 'react';
import { Printer, X, Check, Copy, Cpu, ShoppingBag, QrCode } from 'lucide-react';
import { SaleRecord } from '../types';
import { formatIDR } from '../utils/formatters';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
========================================
           RIGFORGE PC DEPOT
   Hardware Inventory & System Integrators
========================================
Receipt: ${sale.receiptNumber}
Date:    ${new Date(sale.timestamp).toLocaleString('id-ID')}
Cashier: ${sale.cashierName} (${sale.cashierRole})
${sale.customerName ? `Customer: ${sale.customerName}\n` : ''}Payment: ${sale.paymentMethod}
----------------------------------------
ITEMS:
${sale.items
  .map(
    (i) =>
      `${i.quantity}x ${i.name}\n   @ ${formatIDR(i.unitPrice)} ea  = ${formatIDR(i.lineTotal)}${
        i.serialNumbers && i.serialNumbers.length > 0
          ? '\n   S/N: ' +
            i.serialNumbers
              .map(
                (sn) =>
                  `${sn.serialNumber} [Garansi: ${sn.warrantyMonths} Bln s/d ${new Date(
                    sn.warrantyExpiryDate
                  ).toLocaleDateString('id-ID')}]`
              )
              .join('\n   S/N: ')
          : ''
      }`
  )
  .join('\n')}
----------------------------------------
Original Subtotal:  ${formatIDR(sale.originalSubtotal)}
${
  sale.isPriceOverridden
    ? `Price Override:   ${sale.overrideDifference < 0 ? '-' : '+'}${formatIDR(
        Math.abs(sale.overrideDifference)
      )} (${sale.overrideReason || 'Custom adjustment'})\n`
    : ''
}FINAL TOTAL PAID:   ${formatIDR(sale.finalTotal)}
========================================
Thank you for building your rig with us!
Garansi Resmi Distributor & Toko.
Simpan struk ini untuk keperluan klaim RMA / Garansi.
========================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Transaction Successful
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors"
              title="Copy receipt text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div
          id="printable-receipt"
          className="p-6 bg-white text-slate-900 font-mono text-xs select-text overflow-y-auto max-h-[70vh] border-dashed border-b-2 border-slate-200"
        >
          {/* Store Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Cpu className="w-4 h-4 text-blue-600 inline" />
              <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                RigForge PC Depot
              </span>
            </div>
            <p className="text-[11px] text-slate-600">Hardware & Component Specialists</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Mangga Dua Mall Lt. 3 No. 42 · Jakarta</p>
            <p className="text-[10px] text-slate-500">Tel: (021) 612-9988 · support@rigforge.id</p>
          </div>

          {/* Receipt Info */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">RECEIPT NO:</span>
              <span className="font-bold text-slate-900">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DATE & TIME:</span>
              <span>{new Date(sale.timestamp).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CASHIER:</span>
              <span>
                {sale.cashierName} ({sale.cashierRole})
              </span>
            </div>
            {sale.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">CUSTOMER:</span>
                <span>
                  {sale.customerName} {sale.customerPhone ? `(${sale.customerPhone})` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">PAYMENT:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                {sale.paymentMethod === 'QRIS' && <QrCode className="w-3.5 h-3.5 text-emerald-600 inline" />}
                {sale.paymentMethod}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
              <span>Item / Description</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="space-y-2.5">
              {sale.items.map((it, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-medium text-slate-900 leading-snug">
                    {it.name}
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                    <span>
                      {it.quantity} × {formatIDR(it.unitPrice)} ({it.brand} · {it.category})
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatIDR(it.lineTotal)}
                    </span>
                  </div>

                  {/* Serial Numbers & Warranty Tags */}
                  {it.serialNumbers && it.serialNumbers.length > 0 && (
                    <div className="mt-1.5 space-y-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                      {it.serialNumbers.map((sn, sIdx) => (
                        <div key={sIdx} className="text-[10px] flex items-center justify-between text-slate-700">
                          <span className="font-mono font-bold text-blue-900">
                            S/N: {sn.serialNumber}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Garansi: {sn.warrantyMonths} Bln (s/d {new Date(sn.warrantyExpiryDate).toLocaleDateString('id-ID')})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals & Price Override Notice */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Catalog Subtotal:</span>
              <span className="tabular-nums">{formatIDR(sale.originalSubtotal)}</span>
            </div>

            {sale.isPriceOverridden && (
              <div className="p-2 bg-amber-50 rounded border border-amber-200 my-1 space-y-0.5">
                <div className="flex justify-between font-semibold text-amber-900">
                  <span>Price Override Applied:</span>
                  <span className="tabular-nums">
                    {sale.overrideDifference < 0 ? '-' : '+'}
                    {formatIDR(Math.abs(sale.overrideDifference))}
                  </span>
                </div>
                {sale.overrideReason && (
                  <div className="text-[10px] text-amber-800 italic">
                    Note: "{sale.overrideReason}"
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TOTAL PAID:</span>
              <span className="tabular-nums font-mono text-base text-blue-700">
                {formatIDR(sale.finalTotal)}
              </span>
            </div>
          </div>

          {/* Footer Barcode & Policy */}
          <div className="pt-4 text-center space-y-2">
            <div className="font-mono text-[9px] tracking-widest text-slate-400 select-none">
              ||||| | |||||||| |||| | |||||| |||||||| |||||
            </div>
            <p className="text-[10px] text-slate-500">
              Semua komponen bergaransi resmi distributor Indonesia. Simpan struk ini untuk keperluan klaim RMA / garansi.
            </p>
            <p className="text-[9px] text-slate-400 font-sans">
              Terima kasih telah berbelanja di RigForge PC Depot!
            </p>
          </div>

        </div>

        {/* Modal Bottom Buttons (no-print) */}
        <div className="no-print p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Recorded in store audit logs
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
