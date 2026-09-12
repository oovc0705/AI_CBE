/**
 * Multi-currency formatting utility for global e-commerce.
 * Detects locale from browser and formats prices accordingly.
 */

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', rate: 1, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
  GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' },
  JPY: { symbol: '¥', rate: 149.5, locale: 'ja-JP' },
  CNY: { symbol: '¥', rate: 7.25, locale: 'zh-CN' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

const STORAGE_KEY = 'preferred_currency';

/** Get user's preferred currency from localStorage, fallback to USD for global users. */
export function getPreferredCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in SUPPORTED_CURRENCIES) return stored as CurrencyCode;
  return 'USD';
}

export function setPreferredCurrency(code: CurrencyCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, code);
  }
}

/** Format a CNY price into the user's preferred currency display string. */
export function formatPrice(cnyPrice: number, currency?: CurrencyCode): string {
  const code = currency ?? getPreferredCurrency();
  const { rate, symbol, locale } = SUPPORTED_CURRENCIES[code];
  const converted = cnyPrice * rate;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'JPY' ? 0 : 2,
      maximumFractionDigits: code === 'JPY' ? 0 : 2,
    }).format(converted);
  } catch {
    return `${symbol}${converted.toFixed(2)}`;
  }
}
