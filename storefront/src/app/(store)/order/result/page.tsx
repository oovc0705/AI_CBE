'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { trackEvent } from '@/lib/analytics';
import { getPaymentMethod } from '@/lib/payment-methods';
import { appendUserOrder, type OrderSummary } from '@/lib/user-store';

interface OrderItemData {
  id: number;
  price: number;
  quantity: number;
  productSnapshot?: { name?: string; imageUrl?: string; slug?: string };
}

interface OrderData {
  id: number;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionNo?: string;
  customerEmail?: string;
  shippingFee?: number;
  taxAmount?: number;
  shippingAddress?: Record<string, string>;
  items?: OrderItemData[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PENDING:   { color: 'text-warning', bg: 'bg-warning/10' },
  PAID:      { color: 'text-success', bg: 'bg-success/10' },
  SHIPPED:   { color: 'text-info',    bg: 'bg-info/10' },
  REFUNDED:  { color: 'text-error',   bg: 'bg-error/10' },
  COMPLETED: { color: 'text-success', bg: 'bg-success/10' },
  CANCELLED: { color: 'text-gray-500', bg: 'bg-gray-100' },
};

function OrderResultContent() {
  const t = useTranslations('orderResult');
  const tStatus = useTranslations('orders');
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const initialStatus = searchParams.get('status'); // 'paid' | 'pending'
  const tracked = useRef(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 200 && json.data) {
          setOrder(json.data);
          // 保存到当前用户的本地订单列表
          try {
            const o = json.data as OrderData;
            const summary: OrderSummary = {
              id: o.id,
              orderNo: o.orderNo,
              totalAmount: o.totalAmount,
              currency: o.currency || 'USD',
              status: o.status,
              paymentMethod: o.paymentMethod,
              paymentStatus: o.paymentStatus,
              customerEmail: o.customerEmail,
              shippingAddress: o.shippingAddress,
              items: (o.items || []).map((it) => ({
                productId: it.id,
                name: it.productSnapshot?.name,
                price: Number(it.price),
                quantity: it.quantity,
                imageUrl: it.productSnapshot?.imageUrl,
                slug: it.productSnapshot?.slug,
              })),
              createdAt: new Date(o.createdAt).getTime() || Date.now(),
            };
            appendUserOrder(summary);
          } catch {
            /* ignore */
          }
          if (!tracked.current) {
            tracked.current = true;
            trackEvent('purchase', {
              transaction_id: json.data.orderNo || orderId,
              value: json.data.totalAmount ?? 0,
              currency: json.data.currency || 'USD',
              items: [],
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const statusInfo = order ? (STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING) : null;
  const statusLabel = order ? tStatus(`status.${order.status.toLowerCase()}`) : '';
  const isPaid = (order?.status === 'PAID') || (order?.status === 'SHIPPED') || (order?.status === 'COMPLETED')
    || (!order && initialStatus === 'paid');
  const pm = order?.paymentMethod ? getPaymentMethod(order.paymentMethod) : undefined;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 animate-fade-in">
      {/* Status Icon / Headline */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center animate-scale-in ${
          isPaid ? 'bg-brand/10' : 'bg-warning/10'
        }`}>
          {isPaid ? (
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h1 className="text-h2 font-bold text-gray-900 mb-3">
          {isPaid ? t('paymentSuccessful') : t('orderReceived')}
        </h1>
        <p className="text-body-base text-gray-500">
          {isPaid ? t('paymentSuccessfulDesc') : t('orderReceivedDesc')}
        </p>
      </div>

      {/* Order Summary Card */}
      {loading ? (
        <div className="card-content animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-3" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ) : order ? (
        <div className="card-content animate-slide-up">
          <h2 className="text-h5 font-bold text-gray-900 mb-4">{t('orderSummary')}</h2>
          <div className="space-y-3 text-body-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('orderNo')}</span>
              <span className="font-mono text-gray-700">{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('date')}</span>
              <span className="text-gray-700">
                {new Date(order.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('status')}</span>
              {statusInfo && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold ${statusInfo.color} ${statusInfo.bg}`}>
                  {statusLabel}
                </span>
              )}
            </div>

            {/* Payment info */}
            <div className="flex justify-between">
              <span className="text-gray-500">{t('payment')}</span>
              <span className="text-gray-700 text-right">
                {pm ? pm.label : order.paymentMethod || '—'}
              </span>
            </div>
            {order.transactionNo && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('transaction')}</span>
                <span className="font-mono text-gray-700 text-caption break-all">{order.transactionNo}</span>
              </div>
            )}

            {/* Items snapshot */}
            {order.items && order.items.length > 0 && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <div className="space-y-2">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-gray-700">
                      <Link href={`/products/${it.id}`} className="truncate pr-2 hover:text-brand transition-fast">
                        {it.productSnapshot?.name || `Item #${it.id}`} × {it.quantity}
                      </Link>
                      <span className="font-medium shrink-0">${(Number(it.price) * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Shipping address */}
            {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <div className="text-gray-600">
                  <span className="text-gray-500">{t('shipTo')} </span>
                  {[order.shippingAddress.fullName, order.shippingAddress.street, order.shippingAddress.city,
                    order.shippingAddress.country].filter(Boolean).join(', ')}
                </div>
              </>
            )}

            <div className="h-px bg-gray-200" />
            {order.shippingFee !== undefined && Number(order.shippingFee) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{t('shipping')}</span>
                <span>${Number(order.shippingFee).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline">
              <span className="text-body-base font-semibold text-gray-900">{t('total')}</span>
              <span className="text-h4 font-bold text-price">
                ${Number(order.totalAmount).toFixed(2)} <span className="text-caption text-gray-400 font-normal">{order.currency || 'USD'}</span>
              </span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href={`/account/orders/${order.id}`} className="btn-outline flex-1 text-body-sm py-2.5 text-center active:scale-95">
              {t('viewDetails')}
            </Link>
          </div>
        </div>
      ) : (
        orderId && (
          <p className="text-body-sm text-gray-400 text-center">
            Order ID: <span className="font-mono text-gray-700">{orderId}</span>
          </p>
        )
      )}

      {/* Next-step reassurance */}
      <div className="flex items-center justify-center gap-2 mt-6 text-body-sm text-gray-500">
        <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        <span>
          {order?.customerEmail
            ? t('confirmationSent', { email: order.customerEmail })
            : t('confirmationSentGeneric')}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Link href="/" className="btn-primary active:scale-95 text-center">{t('backToHome')}</Link>
        <Link href="/account/orders" className="btn-outline active:scale-95 text-center">{t('myOrders')}</Link>
      </div>
    </div>
  );
}

export default function OrderResultPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-8 bg-gray-100 rounded w-48 mx-auto mb-4 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-64 mx-auto animate-pulse" />
      </div>
    }>
      <OrderResultContent />
    </Suspense>
  );
}
