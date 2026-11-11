import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wrench, MapPin, Tag, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShopAsset, ShopAssetCategory, ShopAssetCondition, ShopAssetStatus } from '../types';

interface ShopAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAsset?: ShopAsset | null;
}

const CATEGORIES: ShopAssetCategory[] = [
  'Diagnostics & Bench',
  'Storage & Cloning',
  'Soldering & Optics',
  'Cables & Adapters',
  'Hand & Power Tools',
  'Test Components',
  'Other Equipment',
];

const LOCATION_SUGGESTIONS = [
  'Workbench 1',
  'Workbench 2',
  'Microscope Station',
  'Soldering Station',
  'Test Bench A',
  'RMA Diagnostic Corner',
  'Tool Cabinet - Drawer 1',
  'Tool Cabinet - Drawer 2',
  'Storage Rack A',
];

export const ShopAssetModal: React.FC<ShopAssetModalProps> = ({
  isOpen,
  onClose,
  editAsset,
}) => {
  const { addShopAsset, updateShopAsset, currentUser } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopAssetCategory>('Diagnostics & Bench');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<ShopAssetStatus>('ACTIVE');
  const [location, setLocation] = useState('Workbench 1');
  const [assignedTo, setAssignedTo] = useState('');
  const [condition, setCondition] = useState<ShopAssetCondition>('GOOD');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editAsset) {
      setName(editAsset.name);
      setCategory((editAsset.category as ShopAssetCategory) || 'Diagnostics & Bench');
      setBrand(editAsset.brand);
      setModel(editAsset.model || '');
      setAssetTag(editAsset.assetTag);
      setSerialNumber(editAsset.serialNumber || '');
      setStatus(editAsset.status);
      setLocation(editAsset.location);
      setAssignedTo(editAsset.assignedTo || '');
      setCondition(editAsset.condition);
      setPurchaseDate(editAsset.purchaseDate || '');
      setPurchaseCost(editAsset.purchaseCost !== undefined ? editAsset.purchaseCost : '');
      setNotes(editAsset.notes || '');
      setEditReason('');
    } else {
      // Defaults for new asset
      setName('');
      setCategory('Diagnostics & Bench');
      setBrand('');
      setModel('');
      const randomTag = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
      setAssetTag(randomTag);
      setSerialNumber('');
      setStatus('ACTIVE');
      setLocation('Workbench 1');
      setAssignedTo('');
      setCondition('GOOD');
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setPurchaseCost('');
      setNotes('');
      setEditReason('');
    }
    setErrors({});
  }, [editAsset, isOpen]);

  if (!isOpen) return null;

  const handleGenerateTag = () => {
    const catCode = category.slice(0, 3).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setAssetTag(`${catCode}-${rand}`);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Asset / Tool name is required';
    if (!brand.trim()) errs.brand = 'Brand or manufacturer is required';
    if (!assetTag.trim()) errs.assetTag = 'Asset tag / barcode ID is required';
    if (!location.trim()) errs.location = 'Workshop location is required so staff know where to find it';

    if (purchaseCost !== '' && purchaseCost < 0) {
      errs.purchaseCost = 'Cost cannot be negative';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedCost = purchaseCost === '' ? undefined : Math.round(Number(purchaseCost));

    if (editAsset) {
      updateShopAsset(
        editAsset.id,
        {
          name: name.trim(),
          category,
          brand: brand.trim(),
          model: model.trim() || undefined,
          assetTag: assetTag.trim().toUpperCase(),
          serialNumber: serialNumber.trim() || undefined,
          status,
          location: location.trim(),
          assignedTo: assignedTo.trim() || undefined,
          condition,
          purchaseDate: purchaseDate.trim() || undefined,
          purchaseCost: parsedCost,
          notes: notes.trim() || undefined,
        },
        editReason.trim() || `Shop asset updated by ${currentUser?.name || 'Staff'}`
      );
    } else {
      addShopAsset({
        name: name.trim(),
        category,
        brand: brand.trim(),
        model: model.trim() || undefined,
        assetTag: assetTag.trim().toUpperCase(),
        serialNumber: serialNumber.trim() || undefined,
        status,
        location: location.trim(),
        assignedTo: assignedTo.trim() || undefined,
        condition,
        purchaseDate: purchaseDate.trim() || undefined,
        purchaseCost: parsedCost,
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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                {editAsset ? 'Edit Shop Asset / Tool' : 'Register New Shop Asset'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Internal equipment registry · Action logged by <strong className="text-blue-600 dark:text-blue-400">{currentUser?.name || 'Staff'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Row 1: Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Asset / Equipment Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Orico 6629 Dual SATA HDD Cloner Dock, HDMI Microscope 1080P"
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

          {/* Row 2: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Equipment Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopAssetCategory)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
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
                placeholder="e.g. Orico, Andonstar, Quick, Fluke, Streacom"
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

          {/* Row 3: Model & S/N (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Model Number / Spec
              </label>
              <input
                type="text"
                placeholder="e.g. 6629US3-C, AD407, 861DW 1000W"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank if un-serialized shop gear"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 4: Asset Tag (with Auto-Generate) & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Asset Tag / Internal ID *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTag}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate Tag
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. AST-1042"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.assetTag
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.assetTag && <p className="text-[11px] text-rose-500 mt-1">{errors.assetTag}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Operational Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShopAssetStatus)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Ready & Operational)</option>
                <option value="IN_USE">IN_USE (Currently on Bench/Job)</option>
                <option value="ON_SERVICE">ON_SERVICE (Under Repair/Maintenance)</option>
                <option value="BROKEN">BROKEN (Damaged / Needs Attention)</option>
                <option value="STANDBY">STANDBY (Storage Reserve)</option>
                <option value="SOLD">SOLD (Sold / Liquidated)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Workshop Location & Assigned Station */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Workshop Location / Where to Find *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Workbench 1, Microscope Station"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.location
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              {errors.location && <p className="text-[11px] text-rose-500 mt-1">{errors.location}</p>}

              {/* Location Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className="text-[10px] text-slate-400">Quick:</span>
                {LOCATION_SUGGESTIONS.slice(0, 4).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Assigned Station / Technician
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Tech Bench, Shared Tool"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Optional bench or staff assignment</span>
            </div>
          </div>

          {/* Row 6: Physical Condition & Acquisition Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Physical Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ShopAssetCondition)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="EXCELLENT">EXCELLENT (Like New)</option>
                <option value="GOOD">GOOD (Normal Wear)</option>
                <option value="FAIR">FAIR (Functional / Worn)</option>
                <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
                <option value="DAMAGED">DAMAGED (Missing Parts)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Purchase Cost (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 450000"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                className={`w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                  errors.purchaseCost
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.purchaseCost && <p className="text-[11px] text-rose-500 mt-1">{errors.purchaseCost}</p>}
            </div>
          </div>

          {/* Row 7: Notes & Accessories Included */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Notes & Accessories Included
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Includes 12V 4A power adapter, USB 3.0 host cable. Used for customer cloning and diagnostic backups."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 8: Edit reason if modifying */}
          {editAsset && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Reason for Change (Audit Trail Log)
              </label>
              <input
                type="text"
                placeholder="e.g. Relocated to Workbench 2, Replaced power adapter"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
            >
              {editAsset ? 'Save Asset Changes' : 'Register Shop Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
