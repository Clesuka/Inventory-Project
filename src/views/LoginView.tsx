import React, { useState } from 'react';
import {
  Cpu,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggleSwitch } from '../components/ThemeToggleSwitch';

export const LoginView: React.FC = () => {
  const { login } = useApp();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const res = login(userId, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleQuickFill = (demoId: string, demoPass: string) => {
    setUserId(demoId);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-8 relative selection:bg-blue-500/20 selection:text-blue-600">
      
      {/* Top right theme toggle */}
      <div className="w-full max-w-5xl mx-auto flex justify-end">
        <ThemeToggleSwitch showLabels={true} />
      </div>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-3">
            <Cpu className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
            RigForge <span className="text-blue-600 dark:text-blue-400">PC Depot</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            POS Register & Hardware Inventory Terminal
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
          
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">
              Sign In to Terminal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your Administrator or Staff account credentials.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                User ID *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. admin or staff"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoFocus
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter account password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Quick Demo Credential Helper */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Quick Test Accounts:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              
              {/* Admin Test Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="p-2.5 text-left rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: admin
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Pass: admin123
                </div>
              </button>

              {/* Staff Test Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('staff', 'staff123')}
                className="p-2.5 text-left rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Staff</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: staff
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Pass: staff123
                </div>
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Footer Note */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-slate-400 dark:text-slate-500">
        All login events and operations are stamped in the immutable store audit ledger.
      </div>

    </div>
  );
};
