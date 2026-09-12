'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../AuthProvider';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

interface OrderData {
  id: number;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionNo?: string;
  customerEmail?: string;
  customerNote?: string;
  shippingFee?: number;
  taxAmount?: number;
  createdAt: string;
  updatedAt: string;
  shippingAddress?: Record<string, string>;
  discountAmount?: number;
  items?: { id: number; price: number; quantity: number; productSnapshot?: { name?: string; slug?: string; imageUrl?: string } }[];
}

interface SupportRequestData {
  id: number;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: 'Pending',   color: 'text-warning', bg: 'bg-warning/10' },
  PAID:      { label: 'Paid',      color: 'text-success', bg: 'bg-success/10' },
  SHIPPED:   { label: 'Shipped',   color: 'text-info',    bg: 'bg-info/10' },
  REFUNDED:  { label: 'Refunded',  color: 'text-error',   bg: 'bg-error/10' },
  COMPLETED: { label: 'Completed', color: 'text-success', bg: 'bg-success/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-100' },
};

const REQUEST_TYPES = [
  { value: 'GENERAL',   label: 'General Inquiry' },
  { value: 'REFUND',    label: 'Refund Request' },
  { value: 'EXCHANGE',  label: 'Exchange Request' },
  { value: 'COMPLAINT', label: 'Complaint' },
];

const STATUS_FLOW = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED'];

function StatusTimeline({ current, createdAt }: { current: string; createdAt: string }) {
  const currentIdx = STATUS_FLOW.indexOf(current);
  const isRefunded = current === 'REFUNDED';
  const dateLabel = new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-start gap-0 w-full overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
      {STATUS_FLOW.map((step, idx) => {
        const done = !isRefunded && idx <= currentIdx;
        const active = step === current;
        return (
          <div key={step} className="flex-1 flex items-center min-w-[60px] md:min-w-0">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-caption font-bold transition-all duration-500
                ${done ? 'bg-brand text-white shadow-md shadow-brand/30' : 'bg-gray-200 text-gray-400'}
                ${active ? 'ring-4 ring-brand/20 scale-110' : ''}`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`mt-2 text-caption font-medium ${done ? 'text-brand' : 'text-gray-400'}`}>{step}</span>
              <span className={`text-[10px] md:text-caption ${done ? 'text-gray-500' : 'text-gray-300'}`}>
                {done ? dateLabel : '—'}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className="relative h-0.5 w-full -mt-[42px] md:-mt-10 bg-gray-200 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-brand transition-all duration-700 ${done && idx < currentIdx ? 'w-full' : 'w-0'}`}
                />
              </div>
            )}
          </div>
        );
      })}
      {isRefunded && (
        <div className="flex flex-col items-center ml-4 shrink-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-error/10 flex items-center justify-center ring-4 ring-error/20 animate-scale-in">
            <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          <span className="mt-2 text-caption font-medium text-error">REFUNDED</span>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const { isAuthenticated, openAuth } = useAuth();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SupportRequestData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('GENERAL');
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 200) setOrder(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch(`/api/orders/${orderId}/support-requests`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 200) setRequests(json.data || []); })
      .catch(() => {});
  }, [orderId]);

  const handleSubmitSupport = async () => {
    if (!formMessage.trim()) return;
    // 提交工单需要登录
    if (!isAuthenticated) {
      setSubmitResult(null);
      openAuth('login');
      return;
    }
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/support-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formType, message: formMessage }),
      });
      const json = await res.json();
      if (json.code === 200) {
        setSubmitResult('success');
        setFormMessage('');
        setShowForm(false);
        setRequests((prev) => [json.data, ...prev]);
      } else {
        setSubmitResult('error');
      }
    } catch { setSubmitResult('error'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 animate-fade-in">
        <div className="flex gap-8">
          <div className="flex-1 card-content animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-40 mb-6" />
            <div className="h-4 bg-gray-100 rounded w-full mb-3" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="hidden lg:block w-[300px] card-content animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-24 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center animate-fade-in">
        <div className="card-content">
          <p className="text-gray-500 text-body-lg mb-6">Order not found</p>
          <Link href="/account/orders" className="btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] ?? STATUS_MAP.PENDING;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-fade-in">
      {/* Back Link */}
      <Link href="/account/orders"
        className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-brand transition-fast mb-4 md:mb-6 min-h-[44px]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      <div className="flex flex-col lg:flex-row gap-5 md:gap-8">
        {/* Left: Main content */}
        <div className="flex-1 min-w-0 space-y-4 md:space-y-6">
          {/* Order Header + Timeline */}
          <div className="card-content animate-slide-up">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="min-w-0">
                <h1 className="text-h3 font-bold text-gray-900 mb-1">Order Details</h1>
                <p className="font-mono text-body-sm text-gray-500 truncate">{order.orderNo}</p>
                <p className="text-caption text-gray-400 mt-1">
                  Placed {new Date(order.createdAt).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold ${statusInfo.color} ${statusInfo.bg} shrink-0`}>
                {statusInfo.label}
              </span>
            </div>
            <StatusTimeline current={order.status} createdAt={order.createdAt} />
          </div>

          {/* Order Items */}
          {order.items && order.items.length > 0 && (
            <div className="card-content animate-slide-up">
              <h2 className="text-h5 font-bold text-gray-900 mb-4">Items</h2>
              <div className="divide-y divide-gray-100">
                {order.items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="py-4 flex items-center gap-4 group hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors duration-200"
                    style={{ animation: 'slide-up 0.3s ease-out both', animationDelay: `${idx * 60}ms` }}
                  >
                    <Link href={`/products/${it.id}`} className="shrink-0">
                      {it.productSnapshot?.imageUrl ? (
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[var(--radius-btn)] overflow-hidden bg-gray-100 group-hover:scale-105 transition-transform duration-300">
                          <Image src={it.productSnapshot.imageUrl} alt={it.productSnapshot?.name || 'Product'} fill sizes="80px" className="object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                        </div>
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[var(--radius-btn)] bg-gray-100 flex items-center justify-center text-caption text-gray-400 shrink-0">No Image</div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${it.id}`} className="text-body-sm font-medium text-gray-900 hover:text-brand transition-fast line-clamp-2 block">
                        {it.productSnapshot?.name || `Item #${it.id}`}
                      </Link>
                      <p className="text-caption text-gray-400 mt-1">Qty {it.quantity} · @ ${Number(it.price).toFixed(2)}</p>
                    </div>
                    <span className="text-body-sm font-semibold text-gray-900 shrink-0">
                      ${(Number(it.price) * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support Requests */}
          <div className="card-content animate-slide-up" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-h5 font-bold text-gray-900">Support Requests</h2>
              <button type="button" onClick={() => { setShowForm(!showForm); setSubmitResult(null); }}
                className="btn-outline text-body-sm py-2 px-4 active:scale-95">
                {showForm ? 'Cancel' : 'Contact Support'}
              </button>
            </div>

            {!isAuthenticated && (
              <p className="mb-4 text-caption text-gray-500">
                You need to{' '}
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="text-brand font-semibold hover:underline"
                >
                  sign in
                </button>{' '}
                to submit a support request.
              </p>
            )}

            {showForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-[var(--radius-btn)] border border-gray-200 animate-slide-up">
                <div className="mb-3">
                  <label className="block text-caption font-medium text-gray-700 mb-1">Request Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className="select-field">
                    {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-caption font-medium text-gray-700 mb-1">Message</label>
                  <textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="Describe your issue..." rows={3} className="input-field resize-none" />
                </div>
                <button type="button" onClick={handleSubmitSupport} disabled={submitting || !formMessage.trim()}
                  className="btn-primary w-full py-2.5 text-body-sm active:scale-95">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                {submitResult === 'error' && <p className="mt-2 text-caption text-error">Failed to submit. Please try again.</p>}
              </div>
            )}

            {submitResult === 'success' && !showForm && (
              <div className="mb-4 p-3 bg-success/10 rounded-[var(--radius-btn)] border border-success/20 animate-scale-in">
                <p className="text-caption text-success font-medium">Request submitted successfully! Our team will get back to you soon.</p>
              </div>
            )}

            {requests.length === 0 ? (
              <p className="text-body-sm text-gray-400 text-center py-6">No support requests yet</p>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 bg-gray-50 rounded-[var(--radius-btn)] border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-brand/10 text-brand">{req.type}</span>
                      <span className="text-caption text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className={`ml-auto text-caption font-medium ${
                        req.status === 'OPEN' ? 'text-warning' : req.status === 'RESOLVED' ? 'text-success' : 'text-gray-500'
                      }`}>{req.status}</span>
                    </div>
                    <p className="text-body-sm text-gray-700">{req.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sticky summary sidebar */}
        <div className="lg:w-[300px] shrink-0">
          <div className="card-content sticky top-[80px] animate-slide-up" style={{ animationDelay: '80ms' }}>
            <h2 className="text-h5 font-bold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-3 text-body-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Date</span>
                <span className="text-gray-700">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span className="text-gray-700 text-right">
                  {order.paymentMethod || 'Card'} · {order.currency || 'USD'}
                  {order.transactionNo && (
                    <span className="block text-caption text-gray-400 font-mono break-all">{order.transactionNo}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking</span>
                <span className="text-gray-400">
                  {order.status === 'SHIPPED' || order.status === 'COMPLETED' ? 'Available soon' : '—'}
                </span>
              </div>
              {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 shrink-0">Shipping</span>
                  <span className="text-gray-700 text-right">
                    {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {order.discountAmount && Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-${Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-baseline">
                <span className="text-body-base font-semibold text-gray-900">Total</span>
                <span className="text-h4 font-bold text-price">${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
            <Link href="/account/orders" className="btn-outline w-full mt-6 py-3 text-center block active:scale-95">
              All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
