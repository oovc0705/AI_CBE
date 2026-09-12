'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '../../AuthProvider';

interface AddToCartButtonProps {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
}

export default function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
}: AddToCartButtonProps) {
  const { isAuthenticated, openAuth } = useAuth();
  const [count, setCount] = useState(1);
  const [added, setAdded] = useState(false);
  const [loginHint, setLoginHint] = useState(false);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      // 弹出登录窗，登录后再加车
      openAuth('login');
      return;
    }
    addToCart({ productId, quantity: count, name, price, imageUrl });
    trackEvent('add_to_cart', {
      items: [{ item_id: String(productId), item_name: name, price, currency: 'CNY', quantity: count }],
      value: price * count,
    });
    setAdded(true);
    setLoginHint(false);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Qty</span>
        <div className="flex items-center border border-gray-200 rounded-[var(--radius-btn)] overflow-hidden hover:border-brand/50 transition-colors duration-300">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-all duration-200 active:scale-90"
          >
            -
          </button>
          <span className="px-3 py-1 min-w-[2.5rem] text-center text-sm font-medium">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-all duration-200 active:scale-90"
          >
            +
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className={`w-full md:w-auto px-8 py-3 font-medium rounded-[var(--radius-btn)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
          added
            ? 'bg-success text-white'
            : 'bg-brand text-white hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/30'
        }`}
      >
        {added ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Added to Cart
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to Cart
          </>
        )}
      </button>
      {!isAuthenticated && (
        <p
          className="text-caption text-gray-500 -mt-1"
          onMouseEnter={() => setLoginHint(true)}
          onMouseLeave={() => setLoginHint(false)}
        >
          {loginHint ? (
            <>
              You need to{' '}
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="text-brand font-semibold hover:underline"
              >
                sign in
              </button>{' '}
              to save items to your cart.
            </>
          ) : (
            'Please sign in to save items to your cart.'
          )}
        </p>
      )}
    </div>
  );
}
