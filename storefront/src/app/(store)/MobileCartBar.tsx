'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';

export default function MobileCartBar() {
  const [cartCount, setCartCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const update = () => {
      const cart = getCart();
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      setTotal(cart.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0));
    };
    update();
    window.addEventListener('storage', update);
    const interval = setInterval(update, 500);
    return () => {
      window.removeEventListener('storage', update);
      clearInterval(interval);
    };
  }, []);

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[var(--shadow-elevation-3)] safe-area-bottom">
      <Link
        href="/cart"
        className="flex items-center justify-between px-4 h-14 active:scale-[0.98] transition-fast"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 flex items-center justify-center px-1 text-caption font-semibold text-white bg-brand rounded-full">
              {cartCount}
            </span>
          </div>
          <span className="text-body-sm font-medium text-gray-700">View Cart</span>
        </div>
        <span className="text-h5 font-bold text-price">${total.toFixed(2)}</span>
      </Link>
    </div>
  );
}
