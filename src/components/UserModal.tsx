import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserCheck, Lock, User, Mail, ShieldAlert } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { useApp } from '../context/AppContext';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editUser?: UserAccount | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, editUser }) => {
  const { createUser, updateUser, currentUser } = useApp();

  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setName(editUser.name);
      setUserId(editUser.userId);
      setRole(editUser.role);
      setPassword(''); // Blank unless updating password
      setEmail(editUser.email);
    } else {
      setName('');
      setUserId('');
      setRole('Staff');
      setPassword('');
      setEmail('');
    }
    setError('');
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!userId.trim()) {
      setError('User ID is required.');
      return;
    }

    if (!editUser && !password.trim()) {
      setError('Password is required for new accounts.');
      return;
    }

    if (editUser) {
      const updates: any = {
        name: name.trim(),
        userId: userId.trim().toLowerCase(),
        role,
        email: email.trim() || `${userId.trim().toLowerCase()}@aceworld.io`,
      };
      if (password.trim()) {
        updates.password = password.trim();
      }

      const res = updateUser(editUser.id, updates);
      if (!res.success) {
        setError(res.error || 'Failed to update user.');
        return;
      }
    } else {
      const res = createUser({
        name: name.trim(),
        userId: userId.trim().toLowerCase(),
        role,
        password: password.trim(),
        email: email.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error || 'Failed to create user.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
                {editUser ? 'Edit User Account' : 'Provision New User Account'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Created by Admin: <strong className="text-blue-600 dark:text-blue-400">{currentUser?.name}</strong>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Employee Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Marcus Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              User ID (Login Username) *
            </label>
            <input
              type="text"
              placeholder="e.g. marcus.v or staff.marcus"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              The employee will use this unique ID to log in at the POS terminal.
            </p>
          </div>

          {/* Role (Admin vs Staff) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Access Level / Role *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('Admin')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  role === 'Admin'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Full control: User accounts, inventory deletion, POS sales, and audit logs.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('Staff')}
                className={`p-3 text-left rounded-xl border transition-all ${
                  role === 'Staff'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Staff</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Operational: Ring up sales, price overrides, add items, adjust stock. No item deleting.
                </div>
              </button>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              {editUser ? 'Reset Password (Leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="text"
              placeholder={editUser ? 'Enter new password or leave blank' : 'e.g. staffPass2026'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. marcus@aceworld.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {editUser ? 'Save Account Changes' : 'Create Account'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
