'use client';

import { useEffect, useState } from 'react';
import { formatPrice, getPreferredCurrency, type CurrencyCode } from '@/lib/currency';

/**
 * Client-side price formatter that respects the user's preferred currency.
 * Reads from localStorage and listens for 'currency-changed' events
 * dispatched by <CurrencySelector>.
 */
export default function CurrencyPrice({
  cnyPrice,
  className,
  as: Tag = 'span',
}: {
  cnyPrice: number;
  className?: string;
  as?: React.ElementType;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  useEffect(() => {
    setCurrency(getPreferredCurrency());
    const handler = (e: Event) => {
      const code = (e as CustomEvent<CurrencyCode>).detail;
      if (code) setCurrency(code);
    };
    window.addEventListener('currency-changed', handler);
    return () => window.removeEventListener('currency-changed', handler);
  }, []);

  return <Tag className={className}>{formatPrice(cnyPrice, currency)}</Tag>;
}
