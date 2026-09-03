export type CurrencyCode = 'BDT' | 'USD' | 'EUR';

export const CURRENCY_STORAGE_KEY = 'presales_tracker_currency_v1';

export function getCurrencyCode(): CurrencyCode {
  if (typeof window === 'undefined') return 'BDT';
  const value = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  return value === 'USD' || value === 'EUR' ? value : 'BDT';
}

export function formatCurrency(amount: number): string {
  return `${getCurrencyCode()} ${Number(amount || 0).toLocaleString()}`;
}

export function formatCurrencyCompact(amount: number): string {
  return formatCurrency(amount);
}
