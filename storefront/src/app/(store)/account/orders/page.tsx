'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Order {
  id: number;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: string;
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

const STATUS_ICONS: Record<string, string> = {
  PENDING:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  PAID:      'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  SHIPPED:   'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  REFUNDED:  'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  COMPLETED: 'M5 13l4 4L19 7',
  CANCELLED: 'M6 18L18 6M6 6l12 12',
};

export default function AccountOrdersPage() {
  const t = useTranslations('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const FILTER_TABS = [
    { label: t('all'), value: '' },
    { label: t('status.pending'), value: 'PENDING' },
    { label: t('status.paid'), value: 'PAID' },
    { label: t('status.shipped'), value: 'SHIPPED' },
    { label: t('status.completed'), value: 'COMPLETED' },
  ];

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: '10' });
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/orders?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code === 200 && json.data) {
          setOrders(json.data.content || []);
          setTotalPages(json.data.totalPages || 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  const handleTabChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-h3 md:text-h2 font-bold text-gray-900">{t('title')}</h1>
        <Link href="/" className="btn-outline text-body-sm py-2.5 active:scale-95 hidden sm:inline-flex">{t('continueShopping')}</Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 md:mb-8 border-b border-gray-200 pb-px overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            className={`relative px-4 py-2.5 text-body-sm font-medium whitespace-nowrap border-b-2 transition-all duration-300 -mb-px ${
              statusFilter === tab.value
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {statusFilter === tab.value && (
              <span className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-brand rounded-full" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-content animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-gray-100 rounded w-40" />
                <div className="h-6 bg-gray-100 rounded-full w-20" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 card-content animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center ring-8 ring-gray-50">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-h4 font-bold text-gray-900 mb-2">
            {statusFilter ? t('noOrdersFilter', { status: t(`status.${statusFilter.toLowerCase()}`) }) : t('noOrders')}
          </h2>
          <p className="text-gray-400 text-body-base mb-8">{t('startShopping')}</p>
          <Link href="/" className="btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform">
            {t('startShopping')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order, idx) => {
              const si = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
              const icon = STATUS_ICONS[order.status] ?? STATUS_ICONS.PENDING;
              const statusLabel = t(`status.${order.status.toLowerCase()}`);
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="card-product block group active:scale-[0.98] transition-all duration-300 hover:shadow-[var(--shadow-elevation-2)] hover:-translate-y-0.5 hover:border-brand/30"
                  style={{ animation: 'slide-up 0.4s ease-out both', animationDelay: `${idx * 60}ms` }}
                >
                  <div className="p-4 md:p-6 flex items-center gap-3 md:gap-5">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${si.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <svg className={`w-5 h-5 ${si.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-caption md:text-body-sm text-gray-700 truncate">{order.orderNo}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-caption font-semibold ${si.color} ${si.bg}`}>{statusLabel}</span>
                      </div>
                      <p className="text-caption text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                      <span className="text-body-base md:text-h5 font-bold text-price">${Number(order.totalAmount).toFixed(2)}</span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-brand group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn-outline py-2 px-4 text-body-sm disabled:opacity-40 active:scale-95">{t('previous')}</button>
              <span className="flex items-center px-4 text-body-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-outline py-2 px-4 text-body-sm disabled:opacity-40 active:scale-95">{t('next')}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
