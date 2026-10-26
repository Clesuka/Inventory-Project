import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Layers,
  Package,
  AlertCircle,
  CheckCircle2,
  Lock,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { categories, addCategory, deleteCategory, items } = useApp();

  const [newCatName, setNewCatName] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);

  // Calculate item counts for each category
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.toLowerCase()] = 0;
    });

    items.forEach((item) => {
      const catKey = (item.category || '').trim().toLowerCase();
      counts[catKey] = (counts[catKey] || 0) + 1;
    });

    return categories.map((cat) => {
      const count = counts[cat.toLowerCase()] || 0;
      return {
        name: cat,
        itemCount: count,
      };
    });
  }, [categories, items]);

  const filteredCategories = useMemo(() => {
    if (!filterQuery.trim()) return categoryStats;
    const query = filterQuery.toLowerCase();
    return categoryStats.filter((c) => c.name.toLowerCase().includes(query));
  }, [categoryStats, filterQuery]);

  const totalInUse = useMemo(() => {
    return categoryStats.filter((c) => c.itemCount > 0).length;
  }, [categoryStats]);

  if (!isOpen) return null;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = addCategory(newCatName);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to add category.');
      return;
    }

    const created = newCatName.trim();
    setNewCatName('');
    setSuccessMsg(`Category "${created}" added successfully.`);
    if (onSelectCategory) {
      onSelectCategory(created);
    }
  };

  const handleConfirmDelete = (catName: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = deleteCategory(catName);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to delete category.');
      setCategoryPendingDelete(null);
      return;
    }

    setCategoryPendingDelete(null);
    setSuccessMsg(`Category "${catName}" deleted.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Hardware Categories</h2>
              <p className="text-xs text-zinc-400">
                Add, manage, and safely retire hardware catalog classifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
              <button
                onClick={() => setErrorMsg(null)}
                className="hover:text-rose-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="hover:text-emerald-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Add Category Form */}
          <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Create New Category
            </label>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Monitors, Audio DAC, Networking, Custom Cables..."
                className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition shrink-0 shadow-lg shadow-cyan-950/50"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </form>
          </div>

          {/* Quick stats & search filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                {categories.length} Total
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">{totalInUse} in use</span>
              <span>•</span>
              <span className="text-zinc-500">{categories.length - totalInUse} unused</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter categories..."
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40 divide-y divide-zinc-800/80">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No categories match your search.
              </div>
            ) : (
              filteredCategories.map(({ name, itemCount }) => {
                const isPendingDelete = categoryPendingDelete === name;
                const hasAssignedItems = itemCount > 0;

                return (
                  <div
                    key={name}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                          <Package className="w-3 h-3 text-zinc-500" />
                          <span>
                            {itemCount} {itemCount === 1 ? 'item' : 'items'} in inventory
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status badge */}
                      {hasAssignedItems ? (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Active ({itemCount})
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          Unused
                        </span>
                      )}

                      {/* Delete Action or Safeguard Indicator */}
                      {isPendingDelete ? (
                        <div className="flex items-center gap-1.5 bg-zinc-900 border border-rose-500/40 p-1 rounded-lg">
                          <span className="text-[11px] text-rose-300 font-medium px-2">
                            Confirm remove?
                          </span>
                          <button
                            onClick={() => handleConfirmDelete(name)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium rounded transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setCategoryPendingDelete(null)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : hasAssignedItems ? (
                        <div
                          className="relative group/lock"
                          title={`Cannot delete: ${itemCount} active item(s) are assigned to "${name}". Reassign or delete those items first.`}
                        >
                          <button
                            disabled
                            className="p-2 text-zinc-600 cursor-not-allowed rounded-lg bg-zinc-900/50 border border-zinc-800/60 flex items-center gap-1 text-xs"
                          >
                            <Lock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[11px] text-zinc-500 hidden md:inline">Locked</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setErrorMsg(null);
                            setCategoryPendingDelete(name);
                          }}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title={`Delete unused category "${name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Deletion rule helper note */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex items-start gap-2.5 text-zinc-400 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-zinc-300">Data Integrity Protection: </span>
              Categories with existing products cannot be deleted. To retire a category, update or remove its assigned items in the inventory first.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
