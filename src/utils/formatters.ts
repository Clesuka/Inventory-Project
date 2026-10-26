/**
 * Currency formatter for Indonesian Rupiah (IDR / Rp. )
 * Formats numbers into Indonesian standard: Rp 16.500.000
 */
export const formatIDR = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
};

/**
 * Format IDR without the "Rp " prefix (e.g. for inside inputs or receipts)
 */
export const formatIDRNumber = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0';
  }
  return Math.round(amount).toLocaleString('id-ID');
};

/**
 * Robust IDR string/number parser.
 * Strips all non-digit characters (including "Rp", ".", ",", spaces)
 * and returns the clean integer number.
 * e.g. "Rp 1.500.000" -> 1500000
 * e.g. "1.500.000" -> 1500000
 * e.g. "1500000" -> 1500000
 */
export const parseIDR = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.max(0, Math.round(value));
  }
  const cleanDigits = value.replace(/\D/g, '');
  if (!cleanDigits) return 0;
  const parsed = parseInt(cleanDigits, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Human-readable short scale in Indonesian (e.g., "1,5 Juta", "150 Ribu", "12,8 Juta", "1,2 Miliar")
 * Helps cashiers immediately distinguish orders of magnitude (150K vs 1.5M vs 15M) to prevent zero-typos.
 */
export const formatIDRShort = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined || amount <= 0) {
    return '0 Rupiah';
  }

  const rounded = Math.round(amount);

  if (rounded >= 1_000_000_000) {
    const val = rounded / 1_000_000_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.', ',');
    return `${formatted} Miliar Rupiah`;
  }

  if (rounded >= 1_000_000) {
    const val = rounded / 1_000_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(val < 10 ? 2 : 1).replace('.', ',');
    return `${formatted} Juta Rupiah`;
  }

  if (rounded >= 1_000) {
    const val = rounded / 1_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(1).replace('.', ',');
    return `${formatted} Ribu Rupiah`;
  }

  return `${rounded.toLocaleString('id-ID')} Rupiah`;
};

