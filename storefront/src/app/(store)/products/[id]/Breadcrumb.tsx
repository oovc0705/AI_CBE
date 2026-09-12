'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface BreadcrumbProps {
  category?: string;
  brand?: string;
  productName: string;
}

export default function Breadcrumb({ category, brand, productName }: BreadcrumbProps) {
  const t = useTranslations('common');

  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:mb-6">
      <ol className="flex items-center gap-1 text-caption md:text-body-sm text-gray-500 flex-wrap">
        <li>
          <Link href="/" className="hover:text-brand transition-fast">{t('home')}</Link>
        </li>
        <li aria-hidden className="text-gray-300">/</li>
        <li>
          <Link
            href={`/?category=${encodeURIComponent(category || '')}`}
            className="hover:text-brand transition-fast"
          >
            {category || t('shop')}
          </Link>
        </li>
        {brand && (
          <>
            <li aria-hidden className="text-gray-300">/</li>
            <li>
              <Link
                href={`/search?brands=${encodeURIComponent(brand)}`}
                className="hover:text-brand transition-fast"
              >
                {brand}
              </Link>
            </li>
          </>
        )}
        <li aria-hidden className="text-gray-300">/</li>
        <li className="text-gray-700 font-medium truncate max-w-[8rem] md:max-w-[12rem]">{productName}</li>
      </ol>
    </nav>
  );
}
