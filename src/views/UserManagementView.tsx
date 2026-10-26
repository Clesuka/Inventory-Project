import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  AlertTriangle,
  Mail,
  Calendar,
} from 'lucide-react';
import { UserAccount } from '../types';
import { useApp } from '../context/AppContext';
import { UserModal } from '../components/UserModal';

export const UserManagementView: React.FC = () => {
  const { accounts, currentUser, deleteUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Staff'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Deletion modal state
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Counts
  const adminCount = accounts.filter((a) => a.role === 'Admin').length;
  const staffCount = accounts.filter((a) => a.role === 'Staff').length;

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = acc.name.toLowerCase().includes(q);
        const matchId = acc.userId.toLowerCase().includes(q);
        const matchEmail = acc.email.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchEmail) return false;
      }
      if (roleFilter !== 'All' && acc.role !== roleFilter) return false;
      return true;
    });
  }, [accounts, searchQuery, roleFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: UserAccount) => {
    setEditingUser(acc);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    setDeleteError('');

    const res = deleteUser(userToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || 'Failed to delete user.');
      return;
    }

    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white leading-tight">
              User Account Administration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Provision, manage, and remove Administrator and Staff access credentials.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Account</span>
        </button>
      </div>

      {/* Role Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Total Authorized Accounts
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {accounts.length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrators</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {adminCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Full system management & user CRUD</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Staff Operators</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {staffCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">POS sales, adding items, stock adjustments</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search accounts by name, User ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRoleFilter('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              roleFilter === 'All'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Roles ({accounts.length})
          </button>
          <button
            onClick={() => setRoleFilter('Admin')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              roleFilter === 'Admin'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Admins ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter('Staff')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              roleFilter === 'Staff'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Staff ({staffCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Login User ID</th>
                <th className="py-3 px-3">Access Level</th>
                <th className="py-3 px-3">Contact Email</th>
                <th className="py-3 px-3">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAccounts.map((acc) => {
                const isCurrent = currentUser?.id === acc.id;

                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${acc.avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0`}
                        >
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {acc.userId}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          acc.role === 'Admin'
                            ? 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                            : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {acc.role === 'Admin' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        <span>{acc.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono">
                      {acc.email}
                    </td>

                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(acc.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit credentials or role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setUserToDelete(acc);
                            setDeleteError('');
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        editUser={editingUser}
      />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Delete User Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You are about to remove account for <strong className="text-slate-900 dark:text-white">"{userToDelete.name}"</strong> (User ID: <span className="font-mono">{userToDelete.userId}</span>, Role: {userToDelete.role}).
              </p>
              {userToDelete.id === currentUser?.id && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-semibold">
                  Warning: You are deleting your currently active session. You will be logged out immediately.
                </p>
              )}
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
