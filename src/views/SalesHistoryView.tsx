import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Calendar,
  Printer,
  Tag,
  CreditCard,
  User,
  ShoppingBag,
} from 'lucide-react';
import { SaleRecord } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';

interface SalesHistoryViewProps {
  onViewReceipt: (sale: SaleRecord) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onViewReceipt }) => {
  const { sales } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Summary Metrics
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + s.finalTotal, 0);
  }, [sales]);

  const totalSalesCount = sales.length;

  const totalDiscountGiven = useMemo(() => {
    return sales.reduce(
      (sum, s) => (s.isPriceOverridden && s.overrideDifference < 0 ? sum + Math.abs(s.overrideDifference) : sum),
      0
    );
  }, [sales]);

  const overriddenSalesCount = useMemo(() => {
    return sales.filter((s) => s.isPriceOverridden).length;
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchReceipt = sale.receiptNumber.toLowerCase().includes(q);
        const matchCashier = sale.cashierName.toLowerCase().includes(q);
        const matchCustomer = sale.customerName?.toLowerCase().includes(q);
        const matchItems = sale.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchReceipt && !matchCashier && !matchCustomer && !matchItems) return false;
      }
      return true;
    });
  }, [sales, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatIDR(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Net revenue processed
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Receipts</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalSalesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total customer checkout slips
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Price Override Orders</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {overriddenSalesCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Transactions with customized pricing
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Discounts Given</span>
            <Tag className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatIDR(totalDiscountGiven)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Price cuts & bundle promotions
          </div>
        </div>

      </div>

      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search receipts by #, cashier, customer, or component..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Showing {filteredSales.length} transaction(s)
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            No sales recorded yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Go to the POS Register tab to process your first checkout transaction.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Cashier</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Sold</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Price Override</th>
                  <th className="py-3 px-3 text-right">Final Total</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredSales.map((sale) => {
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {sale.receiptNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(sale.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {sale.cashierName}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {sale.customerName || 'Walk-in Customer'}
                      </td>

                      <td className="py-3 px-3 max-w-xs text-slate-700 dark:text-slate-300">
                        <div className="truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatIDR(sale.originalSubtotal)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {sale.isPriceOverridden ? (
                          <span
                            className={
                              sale.overrideDifference < 0
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-blue-600 dark:text-blue-400 font-bold'
                            }
                          >
                            {sale.overrideDifference < 0 ? '-' : '+'}
                            {formatIDR(Math.abs(sale.overrideDifference))}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatIDR(sale.finalTotal)}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {sale.paymentMethod}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
