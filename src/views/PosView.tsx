import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  AlertCircle,
  Tag,
  CreditCard,
  User,
  Phone,
  Package,
  Layers,
  Sparkles,
  Receipt,
  RotateCcw,
  Barcode,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Item, ItemCategory, CartItem, PaymentMethod } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR, formatIDRShort } from '../utils/formatters';
import { CurrencyInput } from '../components/CurrencyInput';

interface PosViewProps {
  onSaleCompleted: (sale: any) => void;
  initialCartItem?: Item | null;
  onClearInitialCartItem?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'QRIS',
];

export const PosView: React.FC<PosViewProps> = ({
  onSaleCompleted,
  initialCartItem,
  onClearInitialCartItem,
}) => {
  const { items, categories, currentUser, completeSale } = useApp();

  // Dynamic category tabs
  const allCategoryTabs = useMemo(() => ['All', ...categories], [categories]);

  // Catalog search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);

  // Expanded serial drawers in cart (itemId -> boolean)
  const [expandedSerials, setExpandedSerials] = useState<Record<string, boolean>>({});
  const [serialScanInputs, setSerialScanInputs] = useState<Record<string, string>>({});

  // Price overrides (numeric for accurate calculation & auto-formatted display)
  // For single item: singleItemPriceOverride holds the edited unit price
  const [singleItemPriceOverride, setSingleItemPriceOverride] = useState<number>(0);
  
  // For multiple items: multiItemTotalOverride holds the edited total price
  const [multiItemTotalOverride, setMultiItemTotalOverride] = useState<number>(0);

  // Track if user explicitly customized the price
  const [isPriceCustomized, setIsPriceCustomized] = useState<boolean>(false);
  
  // Override note/reason
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Customer & Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string>('');

  // When initialCartItem passed from inventory quick-sell
  useEffect(() => {
    if (initialCartItem) {
      addToCart(initialCartItem);
      if (onClearInitialCartItem) onClearInitialCartItem();
    }
  }, [initialCartItem]);

  // Keep single/multi override strings in sync when cart changes
  const isSingleItem = cart.length === 1;
  const isMultiItem = cart.length > 1;

  // Add item to cart with auto-serial assignment if serialized
  const addToCart = (item: Item) => {
    if (item.stock <= 0) {
      setError(`Cannot add "${item.name}": Out of stock.`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          setError(`Cannot add more "${item.name}": only ${item.stock} in stock.`);
          setTimeout(() => setError(''), 3000);
          return prev;
        }

        const nextQty = existing.quantity + 1;
        let nextSelectedSerials = existing.selectedSerials ? [...existing.selectedSerials] : [];
        if (item.hasSerials && item.serialNumbers) {
          const available = item.serialNumbers.filter(
            (s) => s.status === 'IN_STOCK' && !nextSelectedSerials.includes(s.serialNumber)
          );
          if (available.length > 0) {
            nextSelectedSerials.push(available[0].serialNumber);
          }
        }

        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: nextQty, selectedSerials: nextSelectedSerials } : ci
        );
      } else {
        let initialSerials: string[] | undefined;
        if (item.hasSerials && item.serialNumbers) {
          const available = item.serialNumbers.filter((s) => s.status === 'IN_STOCK');
          if (available.length > 0) {
            initialSerials = [available[0].serialNumber];
          }
        }
        return [...prev, { item, quantity: 1, unitPrice: item.sellPrice, selectedSerials: initialSerials }];
      }
    });
  };

  // Stepper quantity update
  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    const targetItem = items.find((i) => i.id === itemId);
    if (targetItem && newQty > targetItem.stock) {
      setError(`Maximum in-stock quantity for this item is ${targetItem.stock}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id !== itemId) return ci;
        let serials = ci.selectedSerials ? [...ci.selectedSerials] : [];
        if (ci.item.hasSerials && ci.item.serialNumbers) {
          if (newQty < serials.length) {
            serials = serials.slice(0, newQty);
          } else if (newQty > serials.length) {
            const available = ci.item.serialNumbers
              .filter((s) => s.status === 'IN_STOCK' && !serials.includes(s.serialNumber))
              .map((s) => s.serialNumber);
            const needed = newQty - serials.length;
            serials = [...serials, ...available.slice(0, needed)];
          }
        }
        return { ...ci, quantity: newQty, selectedSerials: serials };
      })
    );
  };

  // Toggle individual serial number selection
  const toggleSerialSelection = (itemId: string, serialNumber: string) => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id !== itemId) return ci;
        const current = ci.selectedSerials || [];
        const exists = current.includes(serialNumber);
        if (exists) {
          return { ...ci, selectedSerials: current.filter((s) => s !== serialNumber) };
        } else {
          if (current.length >= ci.quantity) {
            setError(`Already selected ${ci.quantity} serial(s) for ${ci.item.name}. Increase quantity to select more.`);
            setTimeout(() => setError(''), 3000);
            return ci;
          }
          return { ...ci, selectedSerials: [...current, serialNumber] };
        }
      })
    );
  };

  // Auto-assign first N available serials
  const autoAssignSerials = (itemId: string) => {
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.item.id !== itemId) return ci;
        const available = (ci.item.serialNumbers || [])
          .filter((s) => s.status === 'IN_STOCK')
          .map((s) => s.serialNumber);
        const assigned = available.slice(0, ci.quantity);
        return { ...ci, selectedSerials: assigned };
      })
    );
  };

  // Quick scan/type serial for an item
  const handleScanSerialSubmit = (itemId: string) => {
    const raw = (serialScanInputs[itemId] || '').trim().toUpperCase();
    if (!raw) return;

    const targetCi = cart.find((c) => c.item.id === itemId);
    if (!targetCi) return;

    const available = targetCi.item.serialNumbers?.find(
      (s) => s.serialNumber.toUpperCase() === raw && s.status === 'IN_STOCK'
    );

    if (!available) {
      setError(`Serial "${raw}" is not found or not in-stock for this item.`);
      setTimeout(() => setError(''), 3500);
      return;
    }

    toggleSerialSelection(itemId, available.serialNumber);
    setSerialScanInputs((prev) => ({ ...prev, [itemId]: '' }));
  };

  // Toggle serial drawer visibility
  const toggleDrawer = (itemId: string) => {
    setExpandedSerials((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const nextCart = prev.filter((ci) => ci.item.id !== itemId);
      if (nextCart.length === 0) {
        setIsPriceCustomized(false);
      }
      return nextCart;
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    setSingleItemPriceOverride(0);
    setMultiItemTotalOverride(0);
    setIsPriceCustomized(false);
    setOverrideReason('');
    setCustomerName('');
    setCustomerPhone('');
    setError('');
  };

  // Standard catalog subtotal calculation
  const catalogSubtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.item.sellPrice * ci.quantity, 0);
  }, [cart]);

  // Synchronize override defaults when cart structure changes
  useEffect(() => {
    if (isSingleItem && cart[0]) {
      if (!isPriceCustomized) {
        setSingleItemPriceOverride(cart[0].item.sellPrice);
      }
      setMultiItemTotalOverride(0);
    } else if (isMultiItem) {
      if (!isPriceCustomized) {
        setMultiItemTotalOverride(catalogSubtotal);
      }
      setSingleItemPriceOverride(0);
    } else {
      setSingleItemPriceOverride(0);
      setMultiItemTotalOverride(0);
      setIsPriceCustomized(false);
    }
  }, [isSingleItem, isMultiItem, cart.length === 1 ? cart[0]?.item.id : null, catalogSubtotal]);

  // Compute final total based on user inputs
  const finalCalculatedTotal = useMemo(() => {
    if (cart.length === 0) return 0;

    if (isSingleItem && cart[0]) {
      const unit = isPriceCustomized && singleItemPriceOverride > 0
        ? singleItemPriceOverride
        : cart[0].item.sellPrice;
      return Math.round(unit * cart[0].quantity);
    } else if (isMultiItem) {
      return isPriceCustomized && multiItemTotalOverride > 0
        ? Math.round(multiItemTotalOverride)
        : Math.round(catalogSubtotal);
    }
    return Math.round(catalogSubtotal);
  }, [cart, isSingleItem, isMultiItem, isPriceCustomized, singleItemPriceOverride, multiItemTotalOverride, catalogSubtotal]);

  // Difference from original catalog price
  const priceDifference = finalCalculatedTotal - catalogSubtotal;
  const isOverridden = isPriceCustomized && Math.abs(priceDifference) > 0.009;

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (
        selectedCategory !== 'All' &&
        (item.category || '').toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedCategory]);

  // Process checkout
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Please add at least one PC item to the cart.');
      return;
    }

    // Verify stock availability
    for (const ci of cart) {
      const current = items.find((i) => i.id === ci.item.id);
      if (!current || ci.quantity > current.stock) {
        setError(
          `Insufficient stock for "${ci.item.name}". Only ${current ? current.stock : 0} left in stock.`
        );
        return;
      }
    }

    // Verify serial numbers for serialized hardware
    for (const ci of cart) {
      if (ci.item.hasSerials) {
        const assigned = ci.selectedSerials?.length || 0;
        if (assigned < ci.quantity) {
          setError(
            `Serial number(s) required for "${ci.item.name}": only ${assigned} of ${ci.quantity} assigned. Please select or scan unit serials before completing checkout.`
          );
          setExpandedSerials((prev) => ({ ...prev, [ci.item.id]: true }));
          return;
        }
      }
    }

    // Prepare items to process with customized prices and selected serials
    const itemsToProcess = cart.map((ci) => {
      const activeUnit = isSingleItem && isPriceCustomized && singleItemPriceOverride > 0
        ? singleItemPriceOverride
        : ci.item.sellPrice;
      return {
        item: ci.item,
        quantity: ci.quantity,
        unitPrice: activeUnit,
        selectedSerials: ci.selectedSerials,
      };
    });

    try {
      const saleRecord = completeSale({
        cartItems: itemsToProcess,
        overrideTotal: isMultiItem && isOverridden ? finalCalculatedTotal : undefined,
        overrideReason: isOverridden ? overrideReason.trim() : undefined,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      });

      // Clear cart and notify parent
      clearCart();
      onSaleCompleted(saleRecord);
    } catch (err: any) {
      setError(err?.message || 'Failed to process sale.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Hardware Catalog Quick-Picker (7 cols on desktop) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search & Category Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search PC components or scan barcode SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {allCategoryTabs.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredCatalog.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const inCart = cart.find((ci) => ci.item.id === item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                disabled={isOutOfStock}
                className={`text-left p-3.5 bg-white dark:bg-slate-900 rounded-xl border transition-all flex flex-col justify-between group ${
                  inCart
                    ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                } ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {item.category}
                    </span>
                    <span className="font-mono text-[10px]">{item.sku}</span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                    {item.name}
                  </h4>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span>{item.brand}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.size}</span>
                    {item.hasSerials && (
                      <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                        S/N · {item.defaultWarrantyMonths || 12}M Garansi
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                    {formatIDR(item.sellPrice)}
                  </span>

                  <div className="text-right">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                        Out of stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        Stock: <strong className="text-slate-700 dark:text-slate-200">{item.stock}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* RIGHT COLUMN: POS Register Terminal & Price Override (5 cols on desktop) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
        
        {/* Register Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">
                Sales Register
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cashier: <strong className="text-slate-700 dark:text-slate-200">{currentUser?.name || 'Cashier'}</strong> ({currentUser?.role || 'Staff'})
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cart Items List */}
        {cart.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Package className="w-10 h-10 mx-auto stroke-1" />
            <p className="text-xs">Your sales cart is empty.</p>
            <p className="text-[11px] text-slate-400">
              Click any PC part or accessory on the left to begin ring-up.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart.map((ci) => {
              const activeUnit = isSingleItem && isPriceCustomized && singleItemPriceOverride > 0
                ? singleItemPriceOverride
                : ci.item.sellPrice;
              const lineTotal = ci.quantity * activeUnit;

              return (
                <div
                  key={ci.item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="font-semibold text-slate-900 dark:text-white truncate">
                          {ci.item.name}
                        </h5>
                        {ci.item.hasSerials && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                            S/N
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {ci.item.brand} · {formatIDR(ci.item.sellPrice)} catalog
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}
                        className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {ci.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}
                        className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total & Remove */}
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatIDR(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(ci.item.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove item from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Serial Number Assignment Bar & Drawer if item is serialized */}
                  {ci.item.hasSerials && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            Unit S/N:
                          </span>
                          {ci.selectedSerials && ci.selectedSerials.length >= ci.quantity ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              {ci.selectedSerials.length}/{ci.quantity} Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <AlertCircle className="w-3 h-3" />
                              {ci.selectedSerials?.length || 0}/{ci.quantity} Required
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => autoAssignSerials(ci.item.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                          >
                            Auto-Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleDrawer(ci.item.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                          >
                            <span>{expandedSerials[ci.item.id] ? 'Hide' : 'Select'}</span>
                            {expandedSerials[ci.item.id] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Selected serials preview tags */}
                      {ci.selectedSerials && ci.selectedSerials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ci.selectedSerials.map((sn) => (
                            <span
                              key={sn}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] border border-blue-200 dark:border-blue-800"
                            >
                              <span>{sn}</span>
                              <button
                                type="button"
                                onClick={() => toggleSerialSelection(ci.item.id, sn)}
                                className="text-slate-400 hover:text-rose-500 font-bold ml-0.5"
                                title="Remove serial"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded drawer for scanner and available in-stock chips */}
                      {expandedSerials[ci.item.id] && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          {/* Direct barcode scanner input */}
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Scan or type serial & press Enter..."
                              value={serialScanInputs[ci.item.id] || ''}
                              onChange={(e) =>
                                setSerialScanInputs((prev) => ({ ...prev, [ci.item.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleScanSerialSubmit(ci.item.id);
                                }
                              }}
                              className="flex-1 px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleScanSerialSubmit(ci.item.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Add S/N
                            </button>
                          </div>

                          {/* Available In-Stock serial chips */}
                          <div>
                            <div className="text-[10px] font-medium text-slate-500 mb-1">
                              Available in inventory (Click to select):
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                              {(ci.item.serialNumbers || [])
                                .filter((s) => s.status === 'IN_STOCK')
                                .map((s) => {
                                  const isSelected = ci.selectedSerials?.includes(s.serialNumber);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleSerialSelection(ci.item.id, s.serialNumber)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                      }`}
                                    >
                                      {isSelected ? '✓ ' : ''}{s.serialNumber}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PRICE OVERRIDE ENGINE: SINGLE vs MULTI ITEM */}
        {cart.length > 0 && (
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
            
            {/* Condition 1: Single item in cart -> User can edit the ITEM PRICE */}
            {isSingleItem && cart[0] && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Edit Item Sold Price (IDR - Rp.)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Catalog: <strong className="text-slate-700 dark:text-slate-300">{formatIDR(cart[0].item.sellPrice)}</strong>
                  </span>
                </div>

                <CurrencyInput
                  size="md"
                  value={isPriceCustomized ? singleItemPriceOverride : cart[0].item.sellPrice}
                  originalValue={cart[0].item.sellPrice}
                  onChange={(val) => {
                    setSingleItemPriceOverride(val);
                    setIsPriceCustomized(val !== cart[0].item.sellPrice);
                  }}
                  showHelpers={true}
                  showShortScale={true}
                  showQuickAdjustments={true}
                />

                <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-400 mt-1.5">
                  <span>
                    Auto-formatted currency: thousands formatted to prevent zero typos.
                  </span>
                  {cart[0].quantity > 1 && (
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      Total ({cart[0].quantity}x): {formatIDR(finalCalculatedTotal)}
                    </span>
                  )}
                </div>

                {/* If quantity > 1, also allow direct editing of total sales price */}
                {cart[0].quantity > 1 && (
                  <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                        Or Edit Total Sale Price for {cart[0].quantity} units
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Catalog Total: {formatIDR(cart[0].item.sellPrice * cart[0].quantity)}
                      </span>
                    </div>
                    <CurrencyInput
                      size="sm"
                      value={finalCalculatedTotal}
                      originalValue={cart[0].item.sellPrice * cart[0].quantity}
                      onChange={(totalVal) => {
                        const derivedUnit = Math.round(totalVal / cart[0].quantity);
                        setSingleItemPriceOverride(derivedUnit);
                        setIsPriceCustomized(totalVal !== cart[0].item.sellPrice * cart[0].quantity);
                      }}
                      showHelpers={true}
                      showShortScale={true}
                      showQuickAdjustments={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Condition 2: Multiple items in cart -> User can edit the TOTAL SALE PRICE */}
            {isMultiItem && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Edit Total Sale Price (IDR - Rp.)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Catalog Subtotal: <strong className="text-slate-700 dark:text-slate-300">{formatIDR(catalogSubtotal)}</strong>
                  </span>
                </div>

                <CurrencyInput
                  size="lg"
                  value={isPriceCustomized ? multiItemTotalOverride : catalogSubtotal}
                  originalValue={catalogSubtotal}
                  onChange={(val) => {
                    setMultiItemTotalOverride(val);
                    setIsPriceCustomized(val !== catalogSubtotal);
                  }}
                  showHelpers={true}
                  showShortScale={true}
                  showQuickAdjustments={true}
                />

                <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1.5">
                  Multiple items sold: Edit bundle total price directly in Rupiah. Auto-formatted with thousands separators and verbal reader to minimize cashier typo.
                </p>
              </div>
            )}

            {/* Real-time override feedback */}
            {isOverridden && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Price Difference:</span>
                    <span className="font-mono tabular-nums font-bold">
                      {priceDifference < 0 ? '-' : '+'}{formatIDR(Math.abs(priceDifference))}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                      {priceDifference < 0 ? 'Discount' : 'Surcharge'} ({formatIDRShort(Math.abs(priceDifference))})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPriceCustomized(false);
                      setSingleItemPriceOverride(cart[0]?.item.sellPrice || 0);
                      setMultiItemTotalOverride(catalogSubtotal);
                      setOverrideReason('');
                    }}
                    className="text-[11px] text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 underline font-medium"
                  >
                    Reset Price
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Reason for price override (e.g. Bundle discount, VIP customer)"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

          </div>
        )}

        {/* Customer & Payment Method */}
        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="space-y-4 pt-2">
            
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Method (Metode Pembayaran)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors truncate ${
                      paymentMethod === pm
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pm}
                  </button>
                ))}
              </div>
              {paymentMethod === 'QRIS' && (
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px]">QRIS</span>
                  <span>Instant static/dynamic QR code generated on customer checkout terminal.</span>
                </div>
              )}
              {paymentMethod === 'Bank Transfer' && (
                <div className="mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-[11px]">
                  BCA / Mandiri / BNI Virtual Account & Direct Store Wire Transfer.
                </div>
              )}
            </div>

            {/* Optional Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Customer Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Budi Santoso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute inset-y-0 left-2.5 my-auto text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. 0812-3456-7890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Final Sale Summary */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Items Subtotal ({cart.reduce((sum, ci) => sum + ci.quantity, 0)} units):</span>
                <span className="font-mono tabular-nums">{formatIDR(catalogSubtotal)}</span>
              </div>

              {isOverridden && (
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Price Override:</span>
                  <span className="font-mono tabular-nums">
                    {priceDifference < 0 ? '-' : '+'}{formatIDR(Math.abs(priceDifference))}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>FINAL TOTAL:</span>
                <span className="font-mono text-xl tabular-nums text-blue-600 dark:text-blue-400">
                  {formatIDR(finalCalculatedTotal)}
                </span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Complete Sale & Generate Receipt</span>
            </button>

          </form>
        )}

      </div>

    </div>
  );
};
