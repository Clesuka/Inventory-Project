import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ShieldAlert, ShieldCheck, Layers } from 'lucide-react';
import { Item, ItemCategory } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';
import { CurrencyInput } from './CurrencyInput';
import { CategoryManagerModal } from './CategoryManagerModal';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: Item | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  editItem,
}) => {
  const { currentUser, addItem, updateItem, categories } = useApp();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<string>(() => categories[0] || 'GPU');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [sku, setSku] = useState('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState('10');
  const [minStockAlert, setMinStockAlert] = useState('3');
  const [location, setLocation] = useState('');
  const [hasSerials, setHasSerials] = useState(true);
  const [defaultWarrantyMonths, setDefaultWarrantyMonths] = useState('24');
  const [notes, setNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setBrand(editItem.brand);
      setCategory(editItem.category);
      setSize(editItem.size);
      setColor(editItem.color);
      setSku(editItem.sku);
      setBuyPrice(editItem.buyPrice);
      setSellPrice(editItem.sellPrice);
      setStock(editItem.stock.toString());
      setMinStockAlert(editItem.minStockAlert.toString());
      setLocation(editItem.location);
      setHasSerials(editItem.hasSerials ?? false);
      setDefaultWarrantyMonths((editItem.defaultWarrantyMonths ?? 24).toString());
      setNotes(editItem.notes || '');
      setEditReason('');
    } else {
      // Defaults for new item
      setName('');
      setBrand('');
      setCategory(categories[0] || 'GPU');
      setSize('');
      setColor('Stealth Black');
      setSku('');
      setBuyPrice(0);
      setSellPrice(0);
      setStock('5');
      setMinStockAlert('2');
      setLocation('Warehouse-A1');
      setHasSerials(true);
      setDefaultWarrantyMonths('24');
      setNotes('');
      setEditReason('');
    }
    setErrors({});
  }, [editItem, isOpen, categories]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const catCode = category.slice(0, 3).toUpperCase();
    const brandCode = brand ? brand.slice(0, 3).toUpperCase() : 'RIG';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`${catCode}-${brandCode}-${rand}`);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Item name is required';
    if (!brand.trim()) errs.brand = 'Brand manufacturer is required';
    if (!size.trim()) errs.size = 'Size or form factor is required (e.g. ATX, 320mm, 2TB)';
    if (!color.trim()) errs.color = 'Color is required';
    if (!sku.trim()) errs.sku = 'SKU / Barcode is required';

    if (buyPrice <= 0) errs.buyPrice = 'Valid cost price is required';
    if (sellPrice <= 0) errs.sellPrice = 'Valid retail selling price is required';

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) errs.stock = 'Stock must be 0 or greater';

    const numMin = parseInt(minStockAlert, 10);
    if (isNaN(numMin) || numMin < 0) errs.minStockAlert = 'Alert threshold must be >= 0';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedBuy = Math.round(buyPrice);
    const parsedSell = Math.round(sellPrice);
    const parsedStock = parseInt(stock, 10);
    const parsedMinStock = parseInt(minStockAlert, 10);

      const warrantyMonthsNum = hasSerials ? (parseInt(defaultWarrantyMonths, 10) || 12) : undefined;

      if (editItem) {
        updateItem(
          editItem.id,
          {
            name: name.trim(),
            brand: brand.trim(),
            category,
            size: size.trim(),
            color: color.trim(),
            sku: sku.trim(),
            buyPrice: parsedBuy,
            sellPrice: parsedSell,
            stock: parsedStock,
            minStockAlert: parsedMinStock,
            location: location.trim() || 'Floor Storage',
            hasSerials,
            defaultWarrantyMonths: warrantyMonthsNum,
            notes: notes.trim() || undefined,
          },
          editReason.trim() || `Item attributes updated by ${currentUser?.name || 'Staff'}`
        );
      } else {
        addItem({
          name: name.trim(),
          brand: brand.trim(),
          category,
          size: size.trim(),
          color: color.trim(),
          sku: sku.trim(),
          buyPrice: parsedBuy,
          sellPrice: parsedSell,
          stock: parsedStock,
          minStockAlert: parsedMinStock,
          location: location.trim() || 'Floor Storage',
          hasSerials,
          defaultWarrantyMonths: warrantyMonthsNum,
          notes: notes.trim() || undefined,
        });
      }

      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
              {editItem ? 'Edit PC Component / Accessory' : 'Add New Item to Catalog'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Action recorded in audit trail under: <strong className="text-blue-600 dark:text-blue-400">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role || 'Staff'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Row 1: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hardware Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  title="Add, rename, or manage hardware categories"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage</span>
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {/* Ensure editItem category is included even if archived */}
                {editItem && !categories.includes(editItem.category) && (
                  <option value={editItem.category}>{editItem.category} (Legacy)</option>
                )}
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                placeholder="e.g. ASUS, AMD, Corsair, NZXT"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.brand
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.brand && <p className="text-[11px] text-rose-500 mt-1">{errors.brand}</p>}
            </div>
          </div>

          {/* Row 2: Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Component / Accessory Name *
            </label>
            <input
              type="text"
              placeholder="e.g. ROG Strix GeForce RTX 4080 Super OC 16GB"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.name
                  ? 'border-rose-500 dark:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Row 3: Size/Form Factor & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Size / Form Factor / Spec *
              </label>
              <input
                type="text"
                placeholder="e.g. Triple-Fan 357mm, ATX, 2x16GB, M.2 2280"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.size
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.size && <p className="text-[11px] text-rose-500 mt-1">{errors.size}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Color / Finish *
              </label>
              <input
                type="text"
                placeholder="e.g. Stealth Black, Pure White, Gunmetal"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.color
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.color && <p className="text-[11px] text-rose-500 mt-1">{errors.color}</p>}
            </div>
          </div>

          {/* Row 4: SKU with Auto-generate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                SKU / Barcode ID *
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3 h-3" />
                Generate SKU
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. GPU-ASUS-4080S-OC"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                errors.sku
                  ? 'border-rose-500 dark:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.sku && <p className="text-[11px] text-rose-500 mt-1">{errors.sku}</p>}
          </div>

          {/* Row 5: Pricing (Cost vs Retail Sell) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Cost / Buy Price (IDR - Rp.) *
              </label>
              <CurrencyInput
                size="md"
                value={buyPrice}
                onChange={(val) => setBuyPrice(val)}
                showHelpers={true}
                showShortScale={true}
                showQuickAdjustments={false}
              />
              {errors.buyPrice && <p className="text-[11px] text-rose-500 mt-1">{errors.buyPrice}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Retail Selling Price (IDR - Rp.) *
              </label>
              <CurrencyInput
                size="md"
                value={sellPrice}
                onChange={(val) => setSellPrice(val)}
                showHelpers={true}
                showShortScale={true}
                showQuickAdjustments={false}
              />
              {errors.sellPrice && <p className="text-[11px] text-rose-500 mt-1">{errors.sellPrice}</p>}
              
              {buyPrice > 0 && sellPrice > 0 && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex justify-between font-mono">
                  <span>Gross Margin:</span>
                  <span className={`font-semibold ${sellPrice >= buyPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {formatIDR(sellPrice - buyPrice)} (
                    {(((sellPrice - buyPrice) / sellPrice) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Row 6: Stock & Minimum Alert Threshold & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Stock On Hand *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {errors.stock && <p className="text-[11px] text-rose-500 mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Low Stock Alert Limit *
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {errors.minStockAlert && <p className="text-[11px] text-rose-500 mt-1">{errors.minStockAlert}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Shelf / Bin Location
              </label>
              <input
                type="text"
                placeholder="e.g. Shelf-A02, Vault-B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Serial Number & Warranty Policy Section */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasSerials}
                  onChange={(e) => setHasSerials(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Track Individual Unit Serial Numbers (S/N)
                </span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                POS barcode scan & RMA
              </span>
            </div>

            {hasSerials && (
              <div className="pl-6 pt-1 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Warranty Period (Months)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={defaultWarrantyMonths}
                      onChange={(e) => setDefaultWarrantyMonths(e.target.value)}
                      placeholder="e.g. 24"
                      className="w-28 px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-1 text-[11px]">
                      {[12, 24, 36].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDefaultWarrantyMonths(m.toString())}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            defaultWarrantyMonths === m.toString()
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {m}m ({m / 12}y)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Technical Specs / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Dual BIOS switch, PCIe 5.0 ready, includes 12VHPWR adapter, 3-year warranty..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Edit Reason input (for update audit trail) */}
          {editItem && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Reason for Modification (Audit Log)
              </label>
              <input
                type="text"
                placeholder="e.g. Price adjustment due to supplier promo, corrected stock after cycle count"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors"
            >
              {editItem ? 'Save & Record in Audit Log' : 'Add Item to Catalog'}
            </button>
          </div>

        </form>

      </div>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectCategory={(newCat) => setCategory(newCat)}
      />
    </div>
  );
};
