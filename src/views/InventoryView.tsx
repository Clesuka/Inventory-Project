import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpDown,
  Edit2,
  Trash2,
  SlidersHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  DollarSign,
  Boxes,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { Item, ItemCategory } from '../types';
import { useApp } from '../context/AppContext';
import { formatIDR } from '../utils/formatters';
import { CategoryManagerModal } from '../components/CategoryManagerModal';
import { ItemDetailModal } from '../components/ItemDetailModal';

interface InventoryViewProps {
  onOpenAddItem: () => void;
  onEditItem: (item: Item) => void;
  onAdjustStock: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onSendToPos: (item: Item) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddItem,
  onEditItem,
  onAdjustStock,
  onDeleteItem,
  onSendToPos,
}) => {
  const { items, categories, exportInventoryCsv, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'Admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock_asc' | 'stock_desc' | 'price_asc' | 'price_desc'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<Item | null>(null);

  // Dynamic categories with 'All'
  const allCategoryTabs = useMemo(() => ['All', ...categories], [categories]);

  // Extract unique brands for filter dropdown
  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(items.map((i) => i.brand))).sort();
    return ['All', ...brands];
  }, [items]);

  // Compute metrics
  const totalSkus = items.length;
  const totalUnits = items.reduce((sum, i) => sum + i.stock, 0);
  const totalRetailValuation = items.reduce((sum, i) => sum + i.sellPrice * i.stock, 0);
  const lowStockItems = items.filter((i) => i.stock <= i.minStockAlert && i.stock > 0);
  const outOfStockItems = items.filter((i) => i.stock === 0);

  // Filter items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchSize = item.size.toLowerCase().includes(q);
          const matchColor = item.color.toLowerCase().includes(q);
          const matchLocation = item.location?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchSku && !matchSize && !matchColor && !matchLocation) {
            return false;
          }
        }

        // Category
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // Brand
        if (selectedBrand !== 'All' && item.brand !== selectedBrand) {
          return false;
        }

        // Stock status
        if (stockFilter === 'in_stock' && item.stock <= 0) return false;
        if (stockFilter === 'low_stock' && (item.stock > item.minStockAlert || item.stock === 0)) return false;
        if (stockFilter === 'out_of_stock' && item.stock > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        if (sortBy === 'price_asc') return a.sellPrice - b.sellPrice;
        if (sortBy === 'price_desc') return b.sellPrice - a.sellPrice;
        return 0;
      });
  }, [items, searchQuery, selectedCategory, selectedBrand, stockFilter, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Catalog SKUs</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalSkus}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active PC parts & accessories
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total In-Stock Units</span>
            <Boxes className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across showroom & warehouse
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Inventory Retail Value</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatIDR(totalRetailValuation)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total potential retail revenue
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1 flex items-baseline gap-2">
            <span className={lowStockItems.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
              {lowStockItems.length} Low
            </span>
            {outOfStockItems.length > 0 && (
              <span className="text-xs font-normal text-rose-600 dark:text-rose-400 font-sans">
                ({outOfStockItems.length} out of stock)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Items at or below min threshold
          </div>
        </div>

      </div>

      {/* Control Bar: Search, Category Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        
        {/* Top line: Search, View Mode, Export CSV, Add Item */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by part name, brand, SKU, size, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 justify-end">
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                title="Dense table view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Visual card grid view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={exportInventoryCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Manage Categories CTA */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              title="Add or remove hardware categories"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Categories</span>
            </button>

            {/* Add Item Primary CTA */}
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add PC Item</span>
            </button>

          </div>

        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar border-t border-slate-100 dark:border-slate-800/80">
          {allCategoryTabs.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count =
              cat === 'All'
                ? items.length
                : items.filter((i) => (i.category || '').toLowerCase() === cat.toLowerCase()).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
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

        {/* Secondary Filter Row: Brand, Stock Status, Sort */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 uppercase font-medium text-[10px]">Brand:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 text-xs"
            >
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 uppercase font-medium text-[10px]">Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="all">All Items</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="low_stock">Low Stock Warning</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 uppercase font-medium text-[10px] flex items-center gap-0.5">
              <ArrowUpDown className="w-3 h-3" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="name">Name (A-Z)</option>
              <option value="stock_asc">Stock (Lowest First)</option>
              <option value="stock_desc">Stock (Highest First)</option>
              <option value="price_asc">Price (Lowest First)</option>
              <option value="price_desc">Price (Highest First)</option>
            </select>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200 font-mono">{filteredItems.length}</strong> of{' '}
            <span className="font-mono">{items.length}</span> items
          </div>

        </div>

      </div>

      {/* Main Content: Table or Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
            No PC components match your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Try adjusting your search terms, clearing category filters, or add a new component to the inventory catalog.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedBrand('All');
              setStockFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-900/60"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* DENSE TABLE VIEW (Standard Enterprise Retail) */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Specs / Form Factor</th>
                  <th className="py-3 px-3 text-right">Cost</th>
                  <th className="py-3 px-3 text-right">Retail Price</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Last Modified By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredItems.map((item) => {
                  const isLow = item.stock <= item.minStockAlert && item.stock > 0;
                  const isOut = item.stock === 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                      title="Click to view item specifications and activity log"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug transition-colors flex items-center gap-2 flex-wrap">
                          <span>{item.name}</span>
                          {item.hasSerials ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/80 dark:border-blue-800" title="Serialized inventory: each unit is tracked by unique S/N">
                              <ShieldCheck className="w-3 h-3 text-blue-500" />
                              S/N ({item.serialNumbers?.filter(s => s.status === 'IN_STOCK').length || 0})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" title="Non-serialized item (e.g. Tray CPU, bulk accessories)">
                              No S/N (Tray)
                            </span>
                          )}
                        </div>
                        {/* Zero-Pill unboxed metadata discipline */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{item.sku}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="font-sans font-medium text-slate-700 dark:text-slate-300">{item.brand}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="font-sans text-slate-500">{item.color}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                          {item.category}
                        </span>
                      </td>

                      {/* Size / Form Factor */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">
                        {item.size}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {formatIDR(item.buyPrice)}
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatIDR(item.sellPrice)}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs">
                          {isOut ? (
                            <span className="text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
                              0 (Out)
                            </span>
                          ) : isLow ? (
                            <span className="text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40">
                              {item.stock} Low
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {item.stock} in stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.location}
                      </td>

                      {/* Last Modified By (Who CRUD'd) */}
                      <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {item.lastModifiedBy}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Details & Activity Log */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDetailItem(item);
                            }}
                            title="View item specs and activity log"
                            className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Add to POS Cart */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendToPos(item);
                            }}
                            disabled={item.stock === 0}
                            title="Sell item in POS register"
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          {/* Quick Adjust Stock */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdjustStock(item);
                            }}
                            title="Adjust physical stock quantity"
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Edit Item Details */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem(item);
                            }}
                            title="Edit item attributes"
                            className="p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Item (Admin Only) */}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item);
                              }}
                              title="Delete item from inventory"
                              className="p-1.5 rounded-md text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* CARD GRID VIEW (Visual Showcase) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isLow = item.stock <= item.minStockAlert && item.stock > 0;
            const isOut = item.stock === 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedDetailItem(item)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition-all group"
                title="Click to view component specs & activity log"
              >
                <div>
                  {/* Category & Status header */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.hasSerials ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/80 dark:border-blue-800" title="Serialized inventory">
                          <ShieldCheck className="w-3 h-3 text-blue-500" />
                          S/N ({item.serialNumbers?.filter(s => s.status === 'IN_STOCK').length || 0})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" title="Non-serialized item">
                          No S/N (Tray)
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400">{item.location}</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {item.name}
                  </h4>

                  {/* Clean unboxed specs metadata */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.brand}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.size}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.color}</span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 italic">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Pricing & Stock Card Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Retail Price</div>
                      <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatIDR(item.sellPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cost: {formatIDR(item.buyPrice)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Stock Count</div>
                      <div className="font-mono font-bold text-sm">
                        {isOut ? (
                          <span className="text-rose-600 dark:text-rose-400">0 Out</span>
                        ) : isLow ? (
                          <span className="text-amber-600 dark:text-amber-400">{item.stock} Low Stock</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">{item.stock} Units</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Alert at ≤ {item.minStockAlert}
                      </div>
                    </div>
                  </div>

                  {/* Last modified operator */}
                  <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Updated by: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.lastModifiedBy}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* View Details / Log */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailItem(item);
                      }}
                      title="View item specs and activity log"
                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdjustStock(item);
                      }}
                      title="Adjust stock"
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      title="Edit item"
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item);
                        }}
                        title="Delete item"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToPos(item);
                    }}
                    disabled={item.stock === 0}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Sell</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Item Details & Activity Log Modal */}
      <ItemDetailModal
        item={selectedDetailItem}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onEditItem={onEditItem}
        onSendToPos={onSendToPos}
      />

    </div>
  );
};
