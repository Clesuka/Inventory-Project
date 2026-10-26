import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ThemeToggleSwitchProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  className = '',
  showLabels = false,
}) => {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {showLabels && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        onClick={toggleTheme}
        className={`group relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
          isDark
            ? 'bg-slate-800 border border-slate-700/80 shadow-inner'
            : 'bg-amber-100/90 border border-amber-300/80 shadow-inner'
        }`}
      >
        {/* Static Background Icons for both positions */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] pointer-events-none">
          <Sun
            className={`w-3.5 h-3.5 transition-opacity duration-200 ${
              isDark ? 'text-slate-500 opacity-60' : 'opacity-0'
            }`}
          />
          <Moon
            className={`w-3.5 h-3.5 transition-opacity duration-200 ${
              isDark ? 'opacity-0' : 'text-amber-500/70 opacity-80'
            }`}
          />
        </div>

        {/* Sliding Thumb Handle */}
        <span
          className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full shadow-md transition-all duration-300 ease-in-out z-10 ${
            isDark
              ? 'translate-x-8 bg-slate-950 text-blue-400 border border-slate-700 ring-1 ring-blue-500/30'
              : 'translate-x-0 bg-white text-amber-500 border border-amber-200 ring-1 ring-amber-400/40'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 stroke-[2.3] fill-blue-400/20" />
          ) : (
            <Sun className="w-3.5 h-3.5 stroke-[2.3] fill-amber-400/30 animate-spin-slow" />
          )}
        </span>
      </button>
    </div>
  );
};
