'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  type CartItem,
} from '@/lib/cart';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

export default function CartPage() {
  const t = useTranslations('cart');
  const [items, setItems] = useState<CartItem[]>(() => getCart());
  const [total, setTotal] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<{ id: number; name: string; price: number; imageUrl?: string }[]>([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const frontendTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0),
    [items],
  );

  // 向后端请求权威小计金额（防止前端 localStorage 价格被篡改）
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    fetch('/api/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.code === 200 && json.data) setTotal(json.data.totalAmount ?? json.data.total ?? null);
        else setTotal(frontendTotal);
      })
      .catch(() => { if (!cancelled) setTotal(frontendTotal); });
    return () => { cancelled = true; };
  }, [items, frontendTotal]);

  useEffect(() => {
    fetch('/api/products?page=0&size=4')
      .then((r) => r.json())
      .then((json) => { if (json.code === 200) setRecommendations(json.data.content ?? []); })
      .catch(() => {});
  }, []);

  const refreshCart = () => setItems(getCart());

  const handleQuantityChange = (productId: number, quantity: number) => {
    updateCartQuantity(productId, quantity);
    refreshCart();
  };

  const handleRemove = (productId: number) => {
    removeFromCart(productId);
    refreshCart();
  };

  const handleClear = () => {
    clearCart();
    refreshCart();
  };

  const subtotal = items.length === 0 ? 0 : (total ?? frontendTotal);
  const FREE_SHIPPING_THRESHOLD = 99;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (items.length > 0 ? 9.99 : 0);
  const tax = 0;
  const grandTotal = subtotal + shipping + tax;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const allInStock = items.every((i) => (i.quantity ?? 0) > 0 && (i.quantity ?? 0) < 100);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-caption md:text-body-sm text-gray-400 mb-3 md:mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-brand transition-fast">{t('home')}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t('title')}</span>
      </nav>

      <div className="flex items-center justify-between mb-5 md:mb-6 gap-4">
        <div className="flex items-baseline gap-2 md:gap-3">
          <h1 className="text-h3 md:text-h2 font-bold text-gray-900">{t('title')}</h1>
          {itemCount > 0 && (
            <span className="text-body-sm text-gray-500">{itemCount} {itemCount !== 1 ? t('items') : t('item')}</span>
          )}
        </div>
        {itemCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-body-sm text-gray-400 hover:text-error transition-fast active:scale-95 min-h-[44px] px-2"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 card-content animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center ring-8 ring-gray-50">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-h4 font-bold text-gray-900 mb-2">{t('empty')}</h2>
          <p className="text-gray-400 text-body-base mb-8">{t('emptyDescription')}</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform">
            {t('continueShopping')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 min-w-0">
              {/* Column header (desktop) */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 pb-3 mb-1 text-caption uppercase tracking-wide text-gray-400 font-semibold border-b border-gray-200">
                <span>{t('product')}</span>
                <span className="text-center w-28">{t('quantity')}</span>
                <span className="text-right w-24">{t('subtotal')}</span>
                <span className="text-center w-24">{t('action')}</span>
                <span className="w-10" />
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-4 p-3 md:p-4 bg-white border border-gray-200 rounded-[var(--radius-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevation-1)] hover:border-brand/30 flex flex-col gap-3 group"
                    style={{ animation: 'slide-up 0.4s ease-out both', animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Product cell */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {item.imageUrl ? (
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-[var(--radius-btn)] overflow-hidden bg-gray-100 shrink-0">
                          <Image src={item.imageUrl} alt={item.name ?? 'Product'} fill sizes="96px" className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                        </div>
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[var(--radius-btn)] bg-gray-100 flex items-center justify-center text-caption text-gray-400 shrink-0">No Image</div>
                      )}
                      <div className="min-w-0">
                        <Link href={`/products/${item.productId}`} className="font-semibold text-gray-900 line-clamp-2 text-body-sm md:text-body-base hover:text-brand transition-fast block">
                          {item.name || `Product #${item.productId}`}
                        </Link>
                        <p className="text-body-sm text-gray-500 mt-1">
                          {t('unitPrice')} <span className="text-gray-700 font-medium">${(item.price ?? 0).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quantity + Subtotal row (mobile: side by side) */}
                    <div className="flex items-center justify-between gap-3 md:contents">
                      {/* Quantity */}
                      <div className="md:w-28 flex md:justify-center">
                        <div className="flex items-center border border-gray-200 rounded-[var(--radius-btn)] overflow-hidden">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-fast font-medium active:scale-95 text-lg leading-none"
                          >−</button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              handleQuantityChange(item.productId, Number.isNaN(v) ? 1 : v);
                            }}
                            className="w-12 h-9 text-center text-body-sm font-medium border-x border-gray-200 bg-transparent outline-none focus:bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-fast font-medium active:scale-95 text-lg leading-none"
                          >+</button>
                        </div>
                      </div>

                      {/* Line subtotal */}
                      <div className="md:w-24 text-right flex items-baseline gap-2">
                      <span className="md:hidden text-caption text-gray-400">{t('subtotal')}</span>
                      <span className="text-body-base md:text-h5 font-bold text-price">
                        ${((item.price ?? 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Buy Now (single item checkout) */}
                    <div className="md:w-24 flex md:justify-center">
                      <Link
                        href={`/checkout?items=${item.productId}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-body-sm font-medium text-white bg-brand rounded-[var(--radius-btn)] hover:bg-brand-dark transition-fast active:scale-95 whitespace-nowrap min-h-[40px]"
                      >
                        {t('buyNow')}
                      </Link>
                    </div>

                      {/* Remove (desktop) */}
                      <div className="hidden md:flex md:w-10 justify-end">
                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => handleRemove(item.productId)}
                          className="text-caption text-gray-400 hover:text-error transition-fast min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mobile remove button */}
                    <button
            type="button"
            onClick={() => handleRemove(item.productId)}
            className="md:hidden self-start text-caption text-gray-400 hover:text-error transition-fast active:scale-95 min-h-[36px] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            {t('remove')}
          </button>
                  </div>
                ))}
              </div>

              {/* Continue shopping */}
              <div className="mt-6">
                <Link href="/" className="inline-flex items-center gap-1.5 text-body-sm text-gray-600 hover:text-brand transition-fast font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('continueShopping')}
                </Link>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:w-[340px] shrink-0">
              <div className="card-content lg:sticky lg:top-[80px]">
                <h2 className="text-h5 font-bold text-gray-900 mb-5">{t('orderSummary')}</h2>
                <div className="space-y-3 text-body-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('items')} ({itemCount})</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Free shipping progress */}
                  {amountToFreeShipping > 0 ? (
                    <div>
                      <p className="text-caption text-gray-500">
                        {t('addForFreeShipping', { amount: amountToFreeShipping.toFixed(2) })}
                      </p>
                      <div className="h-2 mt-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand to-brand-light transition-all duration-700 ease-out rounded-full"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-success/5 rounded-[var(--radius-btn)] animate-scale-in">
                      <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-caption text-success font-medium">{t('freeShippingUnlocked')}</p>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>{t('shipping')}</span>
                    <span className={shipping === 0 ? 'text-success font-medium' : 'text-gray-900'}>
                      {shipping === 0 ? t('free') : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{t('estimated')} {t('tax')}</span>
                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-body-base font-semibold text-gray-900">{t('total')}</span>
                    <span className="text-h3 font-bold text-price">${grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-caption text-gray-400">{t('taxesCalculated')}</p>
                </div>

                <Link
                  href="/checkout"
                  aria-disabled={!allInStock}
                  className={`btn-primary w-full mt-6 py-3.5 active:scale-95 flex items-center justify-center gap-2 ${!allInStock ? 'pointer-events-none opacity-50' : ''}`}
                >
                  {t('proceedToCheckout')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-caption">{t('secureCheckout')}</span>
                </div>

                {/* Accepted payment badges */}
                <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
                  {['Visa', 'Mastercard', 'PayPal', 'WeChat Pay', 'Alipay'].map((m) => (
                    <span key={m} className="px-2 py-1 text-caption text-gray-500 bg-gray-50 border border-gray-200 rounded-[var(--radius-btn)] font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-gray-200 flex-1" />
                <h2 className="text-h4 font-bold text-gray-900">{t('completeYourOrder')}</h2>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendations.map((p, idx) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="card-product block group active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevation-2)]"
                    style={{ animation: 'slide-up 0.5s ease-out both', animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="relative overflow-hidden aspect-square">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                      )}
                      {/* Add to cart hint overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white text-caption font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                          View Details
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-body-sm truncate group-hover:text-brand transition-fast">{p.name}</h3>
                      <p className="text-body-sm font-bold text-price mt-1">${p.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
