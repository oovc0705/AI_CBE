'use client';

import Link from 'next/link';
import { SITE_NAME } from '@/lib/seo';
import { PAYMENT_ICONS } from '@/lib/trust-badges';
import SubscribeForm from './SubscribeForm';
import { useTranslations } from 'next-intl';

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { label: 'Twitter', href: '#', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'YouTube', href: '#', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
];

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Email subscribe */}
        <div className="mb-10 py-8 border-b border-gray-200">
          <SubscribeForm />
        </div>

        {/* Footer columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-10">
          <div>
            <h4 className="font-bold text-body-sm text-gray-900 mb-3">{t('shop')}</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/search?category=Shoes" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('runningShoes')}
                </Link>
              </li>
              <li>
                <Link href="/search?category=Apparel" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('apparel')}
                </Link>
              </li>
              <li>
                <Link href="/search?category=Accessories" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('accessories')}
                </Link>
              </li>
              <li>
                <Link href="/search?sort=newest" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('newArrivals')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-body-sm text-gray-900 mb-3">{t('support')}</h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/policies/shipping-policy" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('shippingPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/policies/refund-policy" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('refundPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy-policy" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/policies/terms-of-service" className="text-body-sm text-gray-500 hover:text-brand transition-fast">
                  {t('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-bold text-body-sm text-gray-900 mb-3">{t('followUs')}</h4>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-200 hover:bg-brand hover:text-white text-gray-500 flex items-center justify-center transition-fast"
                  aria-label={social.label}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-caption text-gray-400 mt-4 leading-relaxed">
              {t('followDesc')}
            </p>
          </div>
        </div>

        {/* Payment icons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 border-t border-gray-200 pt-6">
          {PAYMENT_ICONS.map((pm) => (
            <span
              key={pm.abbr}
              title={pm.label}
              className="inline-flex items-center justify-center w-10 h-6 rounded-[var(--radius-btn)] border border-gray-200 bg-white text-caption font-semibold text-gray-500"
            >
              {pm.abbr}
            </span>
          ))}
        </div>

        <p className="text-center text-caption text-gray-400">
          {t('copyright', { year: new Date().getFullYear(), siteName: SITE_NAME })}
        </p>
      </div>
    </footer>
  );
}