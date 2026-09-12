'use client';

import { useState, useEffect } from 'react';
import { addToCart } from '@/lib/cart';
import { trackEvent } from '@/lib/analytics';
import { formatPrice, getPreferredCurrency, type CurrencyCode } from '@/lib/currency';
import { useAuth } from '../../AuthProvider';

interface AddToCartBarProps {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  inline?: boolean;
}

const SHOE_SIZES = ['US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13'];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function getSizes(category?: string): string[] {
  if (!category) return APPAREL_SIZES;
  const lower = category.toLowerCase();
  if (lower.includes('shoe') || lower.includes('sneaker')) return SHOE_SIZES;
  return APPAREL_SIZES;
}

export default function AddToCartBar({
  productId,
  name,
  price,
  imageUrl,
  category,
  inline = false,
}: AddToCartBarProps) {
  const { isAuthenticated, openAuth } = useAuth();
  const sizes = getSizes(category);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
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

  const handleAdd = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (!isAuthenticated) {
      // 弹登录窗，未登录不可加车
      openAuth('login');
      return;
    }
    setSizeError(false);
    addToCart({ productId, quantity: count, name, price, imageUrl });
    trackEvent('add_to_cart', {
      items: [{ item_id: String(productId), item_name: `${name} (${selectedSize})`, price, currency, quantity: count }],
      value: price * count,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (inline) {
    return (
      <div className="flex flex-col gap-4">
        {/* Size Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Size</span>
            {sizeError && <span className="text-caption text-error">Please select a size</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { setSelectedSize(size); setSizeError(false); }}
                className={`min-w-[3rem] px-3 py-2 text-body-sm font-medium rounded-[var(--radius-btn)] border transition-fast active:scale-95 ${
                  selectedSize === size
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand hover:text-brand'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity + Add to Cart */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-[var(--radius-btn)] overflow-hidden">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-fast active:scale-95"
            >
              -
            </button>
            <span className="w-11 h-11 flex items-center justify-center text-body-sm font-medium border-x border-gray-200">
              {count}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => c + 1)}
              className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-fast active:scale-95"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 px-8 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-[var(--radius-btn)] transition-fast active:scale-95 min-h-[44px]"
          >
            {added ? 'Added to Cart ✓' : 'Add to Cart'}
          </button>
        </div>
        {!isAuthenticated && (
          <p className="text-caption text-gray-500">
            You need to{' '}
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="text-brand font-semibold hover:underline"
            >
              sign in
            </button>{' '}
            to add items to your cart.
          </p>
        )}
      </div>
    );
  }

  // Mobile sticky bottom bar
  return (
    <div className="bg-white border-t border-gray-200 shadow-[var(--shadow-elevation-3)] safe-area-bottom">
      {/* Mobile size selector */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-hide">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => { setSelectedSize(size); setSizeError(false); }}
              className={`shrink-0 px-3 py-1.5 text-caption font-medium rounded-[var(--radius-btn)] border transition-fast snap-center ${
                selectedSize === size
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {sizeError && <p className="text-caption text-error mt-1">Please select a size</p>}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center border border-gray-200 rounded-[var(--radius-btn)] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-fast active:scale-95"
          >
            -
          </button>
          <span className="w-8 h-10 flex items-center justify-center text-body-sm font-medium border-x border-gray-200">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-fast active:scale-95"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 py-3 bg-brand hover:bg-brand-dark text-white font-semibold rounded-[var(--radius-btn)] transition-fast active:scale-95 min-h-[44px]"
        >
          {added ? 'Added ✓' : `Add to Cart · ${formatPrice(price * count, currency)}`}
        </button>
      </div>
    </div>
  );
}
