import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { RotateCcw, X, Tag } from 'lucide-react';
import { formatIDR, formatIDRNumber, parseIDR, formatIDRShort } from '../utils/formatters';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  originalValue?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showHelpers?: boolean;
  showShortScale?: boolean;
  showQuickAdjustments?: boolean;
  min?: number;
  max?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  originalValue,
  label,
  placeholder = '0',
  disabled = false,
  autoFocus = false,
  className = '',
  size = 'md',
  showHelpers = true,
  showShortScale = true,
  showQuickAdjustments = true,
  min = 0,
  max,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value > 0 ? formatIDRNumber(value) : (value === 0 ? '0' : '');
  });

  // Track cursor position preservation across auto-formatting
  const cursorDigitIndexRef = useRef<number | null>(null);

  // Sync internal display string if external value changes (e.g. cart reset or preset click)
  useEffect(() => {
    const currentNumeric = parseIDR(displayValue);
    if (currentNumeric !== value) {
      setDisplayValue(value > 0 ? formatIDRNumber(value) : (value === 0 ? '0' : ''));
    }
  }, [value]);

  // Restore cursor smoothly after DOM update
  useLayoutEffect(() => {
    if (cursorDigitIndexRef.current !== null && inputRef.current) {
      const targetDigitCount = cursorDigitIndexRef.current;
      const formatted = inputRef.current.value;

      let digitCount = 0;
      let newCursorPos = formatted.length;

      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
        if (digitCount >= targetDigitCount) {
          newCursorPos = i + 1;
          break;
        }
      }

      inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      cursorDigitIndexRef.current = null;
    }
  }, [displayValue]);

  // Handle typing & auto-formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const inputEl = e.target;
    const currentCursor = inputEl.selectionStart || 0;

    // Count how many digits appear before the cursor in the input string
    const digitsBeforeCursor = rawInput.slice(0, currentCursor).replace(/\D/g, '').length;
    cursorDigitIndexRef.current = digitsBeforeCursor;

    // Extract digits only
    const digitsOnly = rawInput.replace(/\D/g, '');

    if (!digitsOnly) {
      setDisplayValue('0');
      onChange(0);
      return;
    }

    let parsedNumber = parseInt(digitsOnly, 10);
    if (isNaN(parsedNumber)) parsedNumber = 0;

    if (min !== undefined && parsedNumber < min) parsedNumber = min;
    if (max !== undefined && parsedNumber > max) parsedNumber = max;

    const formatted = formatIDRNumber(parsedNumber);
    setDisplayValue(formatted);
    onChange(parsedNumber);
  };

  // Keyboard controls (ArrowUp / ArrowDown step in increments of 10,000)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.shiftKey ? 100000 : 10000;
      const nextVal = Math.round(value + step);
      onChange(nextVal);
      setDisplayValue(formatIDRNumber(nextVal));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 100000 : 10000;
      const nextVal = Math.max(min, Math.round(value - step));
      onChange(nextVal);
      setDisplayValue(formatIDRNumber(nextVal));
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    onChange(0);
    inputRef.current?.focus();
  };

  const handleResetToOriginal = () => {
    if (originalValue !== undefined) {
      const rounded = Math.round(originalValue);
      setDisplayValue(formatIDRNumber(rounded));
      onChange(rounded);
      inputRef.current?.focus();
    }
  };

  const handleApplyDiscount = (percent: number) => {
    const base = originalValue !== undefined ? originalValue : value;
    if (base > 0) {
      const discounted = Math.round(base * (1 - percent / 100));
      setDisplayValue(formatIDRNumber(discounted));
      onChange(discounted);
    }
  };

  const handleAdjustDelta = (delta: number) => {
    const nextVal = Math.max(min, Math.round(value + delta));
    setDisplayValue(formatIDRNumber(nextVal));
    onChange(nextVal);
  };

  const handleRoundToThousand = () => {
    if (value > 0) {
      const rounded = Math.round(value / 1000) * 1000;
      setDisplayValue(formatIDRNumber(rounded));
      onChange(rounded);
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'py-1 text-xs',
    md: 'py-1.5 text-sm',
    lg: 'py-2.5 text-base font-extrabold',
  }[size];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        {/* Indonesian Rupiah Prefix */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="font-mono font-bold text-slate-400 dark:text-slate-500 text-xs sm:text-sm select-none">
            Rp
          </span>
        </div>

        {/* Formatted Number Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-9 font-mono font-bold tabular-nums tracking-wide bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${sizeClasses} ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
          }`}
        />

        {/* Quick clear button */}
        {!disabled && value > 0 && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear value"
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live human-readable scale reader & typo guard */}
      {showHelpers && (
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] px-0.5">
          {showShortScale && (
            <div className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300">
              <span className="font-mono font-bold">
                {formatIDR(value)}
              </span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                {formatIDRShort(value)}
              </span>
            </div>
          )}

          {originalValue !== undefined && Math.abs(value - originalValue) > 0.01 && (
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({formatIDR(originalValue)})</span>
            </button>
          )}
        </div>
      )}

      {/* Quick adjustment buttons to minimize cashier typos */}
      {showQuickAdjustments && !disabled && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {originalValue !== undefined && (
            <>
              <button
                type="button"
                onClick={() => handleApplyDiscount(5)}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => handleApplyDiscount(10)}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700"
              >
                -10%
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleAdjustDelta(-50000)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            -50k
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDelta(50000)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            +50k
          </button>
          <button
            type="button"
            onClick={() => handleAdjustDelta(100000)}
            className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            +100k
          </button>
          {value % 1000 !== 0 && (
            <button
              type="button"
              onClick={handleRoundToThousand}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-200 dark:border-amber-800"
            >
              Round to .000
            </button>
          )}
        </div>
      )}
    </div>
  );
};
