'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SUPPORTED_CURRENCIES, getPreferredCurrency, setPreferredCurrency, type CurrencyCode } from '@/lib/currency';

export default function CurrencySelector({ dark = false }: { dark?: boolean } = {}) {
  const t = useTranslations('currency');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    setCurrency(getPreferredCurrency());
  }, []);

  const handleChange = (code: CurrencyCode) => {
    setCurrency(code);
    setPreferredCurrency(code);
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: code }));
  };

  return (
    <select
      value={currency}
      onChange={(e) => handleChange(e.target.value as CurrencyCode)}
      className={`text-body-sm px-2 py-1 cursor-pointer rounded-[var(--radius-btn)] transition-all duration-300 focus:outline-none ${
        dark
          ? 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
          : 'bg-transparent text-gray-600 border border-gray-200 hover:border-gray-300'
      }`}
      aria-label="Currency"
    >
      {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => (
        <option key={code} value={code} className="text-gray-900">
          {t(code) || `${SUPPORTED_CURRENCIES[code].symbol} ${code}`}
        </option>
      ))}
    </select>
  );
}