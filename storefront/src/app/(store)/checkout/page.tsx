'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getCart, clearCart, removeFromCart, type CartItem } from '@/lib/cart';
import { PAYMENT_METHODS, type PaymentMethodCode } from '@/lib/payment-methods';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '../AuthProvider';
import { authHeaders } from '@/lib/auth';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

interface CalcResponse {
  totalAmount: number;
}

const FREE_SHIPPING_THRESHOLD = 99;
const BASE_SHIPPING_FEE = 9.99;
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Japan', 'Singapore', 'Hong Kong (CN)', 'South Korea',
  'Other',
];

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, openAuth } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('CARD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calcTotal, setCalcTotal] = useState<number | null>(null);

  // 检查是否是单个商品结账模式
  const singleItemCheckout = searchParams.get('items');

  useEffect(() => {
    const cart = getCart();
    // 如果是单个商品结账，只保留指定的商品
    if (singleItemCheckout) {
      const productId = parseInt(singleItemCheckout, 10);
      const filteredItems = cart.filter(item => item.productId === productId);
      setItems(filteredItems);
    } else {
      setItems(cart);
    }
    setHydrated(true);
  }, [singleItemCheckout]);

  // 拉取后端权威小计
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    fetch('/api/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
    })
      .then((r) => r.json())
      .then((json: { code: number; data?: CalcResponse }) => {
        if (cancelled) return;
        if (json.code === 200 && json.data) setCalcTotal(json.data.totalAmount ?? 0);
      })
      .catch(() => {})
      .finally(() => { /* noop */ });
    return () => { cancelled = true; };
  }, [items]);

  const frontendSubtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0),
    [items],
  );
  const subtotal = calcTotal ?? frontendSubtotal;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE;
  const tax = 0;
  const grandTotal = subtotal + shipping + tax;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const addressValid = !!fullName.trim() && !!street.trim() && !!city.trim() && !!postalCode.trim();
  const canSubmit = items.length > 0 && emailValid && addressValid && !submitting;

  const handlePlaceOrder = async () => {
    if (!canSubmit) {
      setError(emailValid ? 'Please complete the shipping address.' : 'Please enter a valid email.');
      return;
    }
    // 必须先登录才能下单（订单需要绑定到用户账户）
    if (!isAuthenticated) {
      setError(null);
      openAuth('login');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // 1) 创建订单（待支付）
      const createRes = await fetch('/api/orders', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerEmail: email.trim(),
          customerNote: note.trim(),
          shippingAddress: {
            fullName: fullName.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country,
            phone: phone.trim(),
          },
        }),
      });
      let createJson: { code?: number; message?: string; data?: { id?: number | string; orderNo?: string; orderId?: string | number } } = {};
      try {
        createJson = await createRes.json();
      } catch {
        /* non-JSON body */
      }
      // 后端 OrderController.createOrder 返回 data.orderId（数字主键）和 data.orderNo（业务订单号）。
      // 兼容 id 和 orderId 两种命名，确保解析成功。
      const rawOrderId = createJson.data?.orderId ?? createJson.data?.id;
      const orderId: string = rawOrderId != null ? String(rawOrderId) : '';
      if (!createRes.ok || createJson.code !== 200 || !orderId) {
        // 不向用户暴露后端原始报错，只记录到控制台供排查
        // eslint-disable-next-line no-console
        console.error('[checkout] create order failed', JSON.stringify({ status: createRes.status, body: createJson }, null, 2));
        setError('We couldn\'t place your order. Please check your details and try again.');
        setSubmitting(false);
        return;
      }

      // 2) 模拟支付（选择渠道 -> 后端写流水 + 标记 PAID）
      const payRes = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ paymentMethod }),
      });
      let payJson: { code?: number; message?: string } = {};
      try {
        payJson = await payRes.json();
      } catch {
        /* non-JSON body */
      }
      if (!payRes.ok || payJson.code !== 200) {
        // 订单已创建但支付失败 -> 仍跳转到结果页显示待支付
        // eslint-disable-next-line no-console
        console.error('[checkout] payment failed', {
          orderId,
          status: payRes.status,
          body: payJson,
        });
        setError('Payment couldn’t be completed. Your order is saved — you can retry from My Orders.');
        router.push(`/order/result?orderId=${orderId}&status=pending`);
        return;
      }

      // 3) 清空购物车 + 跳转
      // 如果是单个商品结账，只移除该商品；否则清空整个购物车
      if (singleItemCheckout) {
        const productId = parseInt(singleItemCheckout, 10);
        removeFromCart(productId);
      } else {
        clearCart();
      }
      trackEvent('purchase', {
        transaction_id: createJson.data?.orderNo || orderId,
        value: grandTotal,
        currency: 'USD',
        items: items.map((i) => ({ item_id: i.productId, quantity: i.quantity, price: i.price })),
      });
      router.push(`/order/result?orderId=${orderId}&status=paid`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[checkout] network/unexpected error', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SSR / hydration guard
  if (!hydrated) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="h-8 bg-gray-100 rounded w-48 mb-6 animate-pulse" />
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-4">
            <div className="h-40 bg-gray-100 rounded-[var(--radius-card)] animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-[var(--radius-card)] animate-pulse" />
          </div>
          <div className="h-64 bg-gray-100 rounded-[var(--radius-card)] animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="card-content">
          <h1 className="text-h3 font-bold text-gray-900 mb-3">{t('emptyCart')}</h1>
          <p className="text-gray-500 mb-6">{t('emptyCartDescription')}</p>
          <Link href="/" className="btn-primary">{t('continueShopping')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-body-sm text-gray-400 mb-4 flex items-center gap-1.5">
        <Link href="/cart" className="hover:text-brand transition-fast">{t('cart')}</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{t('title')}</span>
      </nav>

      <h1 className="text-h2 font-bold text-gray-900 mb-8">{t('title')}</h1>

      {/* 登录提示条 */}
      {!isAuthenticated && (
        <div className="mb-6 flex items-center justify-between gap-3 p-4 rounded-[var(--radius-card)] bg-brand/5 border border-brand/15 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
            <p className="text-body-sm text-gray-700">
              {t('signInPrompt')}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Left: forms */}
        <div className="space-y-6 min-w-0">
          {/* Contact */}
          <section className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={1} />
              <h2 className="text-h5 font-bold text-gray-900">{t('contact')}</h2>
            </div>
            <div className="space-y-3">
              <Field label={t('emailAddress')} required error={email && !emailValid ? t('enterValidEmail') : undefined}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label={t('phoneOptional')}>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Shipping */}
          <section className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={2} />
              <h2 className="text-h5 font-bold text-gray-900">{t('shippingAddress')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label={t('fullName')} required>
                  <input className="input-field" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t('streetAddress')} required>
                  <input className="input-field" placeholder="123 Main St" value={street} onChange={(e) => setStreet(e.target.value)} />
                </Field>
              </div>
              <Field label={t('city')} required>
                <input className="input-field" placeholder="New York" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label={t('stateProvince')}>
                <input className="input-field" placeholder="NY" value={state} onChange={(e) => setState(e.target.value)} />
              </Field>
              <Field label={t('postalCode')} required>
                <input className="input-field" placeholder="10001" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </Field>
              <Field label={t('countryRegion')} required>
                <select className="select-field" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label={t('orderNoteOptional')}>
                  <textarea className="input-field resize-none" rows={2} placeholder="Delivery instructions, gift message, etc." value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="card-content">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={3} />
              <h2 className="text-h5 font-bold text-gray-900">{t('paymentMethod')}</h2>
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => {
                const selected = paymentMethod === m.code;
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setPaymentMethod(m.code)}
                    className={`w-full flex items-center gap-3 p-4 rounded-[var(--radius-card)] border-2 transition-fast text-left active:scale-[0.99] ${
                      selected ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-brand' : 'border-gray-300'}`}>
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-body-sm">{m.label}</span>
                        {m.region === 'cn' && (
                          <span className="px-1.5 py-0.5 text-caption rounded border bg-orange-50 text-orange-700 border-orange-200">CN</span>
                        )}
                      </div>
                      <p className="text-caption text-gray-500 mt-0.5">{m.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-caption rounded border font-medium ${m.badgeClass}`}>{m.code}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-gray-400 mt-3 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              {t('demoEnvironment')}
            </p>
          </section>
        </div>

        {/* Right: order summary */}
        <aside className="lg:sticky lg:top-[80px] self-start">
          <div className="card-content">
            <h2 className="text-h5 font-bold text-gray-900 mb-4">{t('orderSummary')}</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-[var(--radius-btn)] overflow-hidden bg-gray-100 shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name ?? ''} fill sizes="56px" className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-caption text-gray-400">N/A</div>
                    )}
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-gray-900 text-white text-caption font-semibold flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-gray-900 truncate">{item.name || `Product #${item.productId}`}</p>
                    <p className="text-caption text-gray-400">@ ${(item.price ?? 0).toFixed(2)}</p>
                  </div>
                  <span className="text-body-sm font-semibold text-gray-900">
                    ${((item.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-body-sm border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>{t('subtotal')}</span>
                <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('shipping')}</span>
                <span className={shipping === 0 ? 'text-success font-medium' : 'text-gray-900'}>
                  {shipping === 0 ? t('free') : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{t('tax')}</span>
                <span className="text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                <span className="text-body-base font-semibold text-gray-900">{t('total')}</span>
                <span className="text-h4 font-bold text-price">${grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-caption text-gray-400">{t('payWith')} <span className="font-medium text-gray-600">{PAYMENT_METHODS.find((m) => m.code === paymentMethod)?.label}</span> · USD</p>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-[var(--radius-btn)] bg-error/10 border border-error/20">
                <p className="text-caption text-error font-medium">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={!canSubmit}
              className="btn-primary w-full mt-5 py-3.5 active:scale-95 disabled:opacity-50"
            >
              {submitting ? t('processing') : t('payAmount', { amount: grandTotal.toFixed(2) })}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-caption">{t('sslSecured')}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="w-7 h-7 rounded-full bg-brand/10 text-brand text-body-sm font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-error">*</span>}
      </span>
      {children}
      {error && <span className="block text-caption text-error mt-1">{error}</span>}
    </label>
  );
}
