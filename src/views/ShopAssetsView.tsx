import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShoppingBag,
  DollarSign,
  Tag,
  Eye,
  Edit,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShopAsset, ShopAssetCategory, ShopAssetStatus } from '../types';
import { ShopAssetModal } from '../components/ShopAssetModal';
import { ShopAssetDetailModal } from '../components/ShopAssetDetailModal';
import { SellAssetModal } from '../components/SellAssetModal';
import { formatIDR } from '../utils/formatters';

interface ShopAssetsViewProps {
  onSendToPos?: (asset: ShopAsset, sellingPrice: number) => void;
}

const CATEGORIES: (ShopAssetCategory | 'All')[] = [
  'All',
  'Diagnostics & Bench',
  'Storage & Cloning',
  'Soldering & Optics',
  'Cables & Adapters',
  'Hand & Power Tools',
  'Test Components',
  'Other Equipment',
];

export const ShopAssetsView: React.FC<ShopAssetsViewProps> = ({ onSendToPos }) => {
  const { shopAssets, deleteShopAsset, exportShopAssetsCsv, currentUser, addShopAsset } = useApp();
  const isAdmin = currentUser?.role === 'Admin';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ShopAssetStatus | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ShopAsset | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<ShopAsset | null>(null);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingAsset, setSellingAsset] = useState<ShopAsset | null>(null);

  const [deletingAsset, setDeletingAsset] = useState<ShopAsset | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return shopAssets.filter((asset) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTag = asset.assetTag.toLowerCase().includes(q);
        const matchName = asset.name.toLowerCase().includes(q);
        const matchBrand = asset.brand.toLowerCase().includes(q);
        const matchModel = asset.model?.toLowerCase().includes(q) ?? false;
        const matchLoc = asset.location.toLowerCase().includes(q);
        const matchSerial = asset.serialNumber?.toLowerCase().includes(q) ?? false;
        const matchAssigned = asset.assignedTo?.toLowerCase().includes(q) ?? false;
        if (!matchTag && !matchName && !matchBrand && !matchModel && !matchLoc && !matchSerial && !matchAssigned) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== 'ALL' && asset.status !== selectedStatus) {
        return false;
      }

      // Category
      if (selectedCategory !== 'All' && (asset.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [shopAssets, searchQuery, selectedStatus, selectedCategory]);

  // Counts for KPIs
  const totalCount = shopAssets.length;
  const activeCount = shopAssets.filter((a) => a.status === 'ACTIVE').length;
  const inUseCount = shopAssets.filter((a) => a.status === 'IN_USE').length;
  const onServiceCount = shopAssets.filter((a) => a.status === 'ON_SERVICE').length;
  const brokenCount = shopAssets.filter((a) => a.status === 'BROKEN').length;
  const soldCount = shopAssets.filter((a) => a.status === 'SOLD').length;

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (asset: ShopAsset) => {
    setEditingAsset(asset);
    setIsAddEditModalOpen(true);
  };

  const handleOpenView = (asset: ShopAsset) => {
    setViewingAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleOpenSell = (asset: ShopAsset) => {
    setSellingAsset(asset);
    setIsSellModalOpen(true);
  };

  const handleOpenDelete = (asset: ShopAsset) => {
    setDeletingAsset(asset);
    setDeleteReason('');
  };

  const handleConfirmDelete = () => {
    if (deletingAsset) {
      deleteShopAsset(deletingAsset.id, deleteReason.trim() || undefined);
      setDeletingAsset(null);
      setDeleteReason('');
    }
  };

  // Quick preset helper when user wants to add standard workshop tools
  const handleAddPreset = (presetName: string, presetBrand: string, presetCategory: ShopAssetCategory, presetLoc: string) => {
    const randomTag = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
    addShopAsset({
      name: presetName,
      brand: presetBrand,
      category: presetCategory,
      assetTag: randomTag,
      status: 'ACTIVE',
      location: presetLoc,
      condition: 'GOOD',
      notes: `Standard shop inventory tool added by ${currentUser?.name || 'Staff'}.`,
    });
  };

  const getStatusBadge = (status: ShopAssetStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'IN_USE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3" />
            In Use
          </span>
        );
      case 'ON_SERVICE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3" />
            On Service
          </span>
        );
      case 'BROKEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Broken
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Standby
          </span>
        );
      case 'SOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <ShoppingBag className="w-3 h-3" />
            Sold
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <Wrench className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Shop Assets & Tools
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track internal diagnostic gear, bench stations, repair equipment, locations & tool liquidation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportShopAssetsCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Download CSV export of all shop assets"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shop Asset</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Assets</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('ACTIVE')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'ACTIVE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
            {activeCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('IN_USE')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'IN_USE'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Use
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-1 tabular-nums">
            {inUseCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('ON_SERVICE')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'ON_SERVICE'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            On Service
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
            {onServiceCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('BROKEN')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'BROKEN'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Broken
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
            {brokenCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('SOLD')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'SOLD'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900'
          }`}
        >
          <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Sold / Liquidated
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 dark:text-purple-400 mt-1 tabular-nums">
            {soldCount}
          </div>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs">
        
        {/* Search Input & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, brand, model, asset tag, serial, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center self-end sm:self-auto bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar border-t border-slate-100 dark:border-slate-800/80">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count =
              cat === 'All'
                ? shopAssets.length
                : shopAssets.filter((a) => (a.category || '').toLowerCase() === cat.toLowerCase()).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded-sm ${
                    isSelected ? 'bg-blue-700 text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. Content Body */}
      {filteredAssets.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'All'
              ? 'No matching shop assets found'
              : 'No Shop Tools or Assets Cataloged Yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery || selectedStatus !== 'ALL' || selectedCategory !== 'All'
              ? 'Try adjusting your search terms or clearing status filters.'
              : 'Add workshop equipment such as SATA cloner docks, test benches, microscopes, and multimeter probes to track their location and operational status.'}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Shop Tool</span>
            </button>
          </div>

          {/* Quick preset suggestions */}
          {shopAssets.length === 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 max-w-lg mx-auto">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Quick-Add Common Shop Equipment:
              </span>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddPreset('Orico 6629 SATA HDD Cloner Dock', 'Orico', 'Storage & Cloning', 'Workbench 1')}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  + Orico 6629 SATA Cloner
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Andonstar AD407 HDMI Digital Microscope', 'Andonstar', 'Soldering & Optics', 'Microscope Station')}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  + HDMI Inspection Microscope
                </button>
                <button
                  type="button"
                  onClick={() => handleAddPreset('Streacom Open Air ATX Diagnostic Test Bench', 'Streacom', 'Diagnostics & Bench', 'Test Bench A')}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  + Open Test Bench
                </button>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                asset.status === 'SOLD'
                  ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10'
                  : asset.status === 'BROKEN'
                  ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                  : asset.status === 'ON_SERVICE'
                  ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div>
                {/* Top Row: Tag & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    {asset.assetTag}
                  </span>
                  {getStatusBadge(asset.status)}
                </div>

                {/* Name */}
                <h3
                  onClick={() => handleOpenView(asset)}
                  className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                >
                  {asset.name}
                </h3>

                {/* Specs / Metadata */}
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{asset.brand}</span>
                  {asset.model && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{asset.model}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{asset.category}</span>
                </div>

                {/* Location Marker */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{asset.location}</span>
                  {asset.assignedTo && (
                    <span className="text-[11px] text-slate-400">({asset.assignedTo})</span>
                  )}
                </div>

                {/* Sold Information Banner */}
                {asset.status === 'SOLD' && asset.saleInfo && (
                  <div className="mt-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                      <span>Sold Price</span>
                      <span className="font-mono">{formatIDR(asset.saleInfo.soldPrice)}</span>
                    </div>
                    {asset.saleInfo.soldToCustomer && (
                      <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                        To: {asset.saleInfo.soldToCustomer}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes preview if present */}
                {asset.notes && asset.status !== 'SOLD' && (
                  <p className="mt-2 text-[11px] text-slate-400 italic line-clamp-2">
                    "{asset.notes}"
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleOpenView(asset)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <div className="flex items-center gap-1">
                  {/* Sell Button if not already sold */}
                  {asset.status !== 'SOLD' && (
                    <button
                      type="button"
                      onClick={() => handleOpenSell(asset)}
                      className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                      title="Sell or liquidate this equipment"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(asset)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit equipment specifications"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(asset)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove from workshop registry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Asset Tag</th>
                  <th className="py-3 px-3.5">Equipment / Model</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Workshop Location</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Condition</th>
                  <th className="py-3 px-3.5 text-right">Cost / Sale</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Tag */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-bold text-blue-600 dark:text-blue-400">
                      {asset.assetTag}
                    </td>

                    {/* Equipment Name */}
                    <td className="py-3 px-3.5 min-w-[220px]">
                      <div
                        onClick={() => handleOpenView(asset)}
                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                      >
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {asset.brand} {asset.model ? `· ${asset.model}` : ''}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {asset.category}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium">
                        <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{asset.location}</span>
                      </div>
                      {asset.assignedTo && (
                        <div className="text-[10px] text-slate-400 ml-4">
                          {asset.assignedTo}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getStatusBadge(asset.status)}
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                      {asset.condition}
                    </td>

                    {/* Cost / Sale Price */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono tabular-nums">
                      {asset.status === 'SOLD' && asset.saleInfo ? (
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {formatIDR(asset.saleInfo.soldPrice)}
                        </span>
                      ) : asset.purchaseCost !== undefined ? (
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatIDR(asset.purchaseCost)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(asset)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Inspect details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {asset.status !== 'SOLD' && (
                          <button
                            type="button"
                            onClick={() => handleOpenSell(asset)}
                            className="p-1 rounded text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            title="Sell asset"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(asset)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(asset)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ShopAssetModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingAsset(null);
        }}
        editAsset={editingAsset}
      />

      <ShopAssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
        }}
        asset={viewingAsset}
        onEdit={(asset) => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
          handleOpenEdit(asset);
        }}
        onSell={(asset) => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
          handleOpenSell(asset);
        }}
        onDelete={(asset) => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
          handleOpenDelete(asset);
        }}
      />

      <SellAssetModal
        isOpen={isSellModalOpen}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellingAsset(null);
        }}
        asset={sellingAsset}
        onSendToPos={onSendToPos}
      />

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setDeletingAsset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Shop Asset?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{deletingAsset.name}</strong> [{deletingAsset.assetTag}] from the workshop registry?
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Reason for Removal (Logged in Audit Trail)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scrapped, Decommissioned, Broken Beyond Repair"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingAsset(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
