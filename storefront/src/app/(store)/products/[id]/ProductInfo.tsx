'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import CurrencyPrice from '@/lib/CurrencyPrice';
import AddToCartBar from './AddToCartBar';
import ShareButtons from './ShareButtons';
import TrustBadges from './TrustBadges';

interface SkuAttribute {
  [key: string]: string;
}

interface ProductSku {
  id: number;
  skuCode: string;
  attributes: SkuAttribute;
  price: number;
  stock: number;
}

interface ProductInfoProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    category?: string;
    brand?: string;
    brandLogoUrl?: string;
    stock?: number;
    skus?: ProductSku[];
  };
  listPrice: number;
  discountPct: number;
  totalStock: number;
  siteUrl: string;
}

export default function ProductInfo({ product, listPrice, discountPct, totalStock, siteUrl }: ProductInfoProps) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');

  const skuAttributes = product.skus
    ? Object.entries(product.skus.reduce((acc, sku) => {
        if (sku.attributes) {
          Object.entries(sku.attributes).forEach(([k, v]) => {
            if (!acc[k]) acc[k] = new Set<string>();
            acc[k].add(String(v));
          });
        }
        return acc;
      }, {} as Record<string, Set<string>>)).map(([key, values]) => ({
        key,
        values: Array.from(values),
      }))
    : [];

  const tSize = useTranslations('sizes');

  const translateSize = (size: string) => {
    const key = size.replace(/ /g, '-').replace(/\./g, '-');
    return tSize(key, { defaultValue: size });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-5 animate-slide-up">
      <div>
        {product.brand && (
          <div className="flex items-center gap-2 mb-2">
            {product.brandLogoUrl && (
              <img src={product.brandLogoUrl} alt={product.brand} width={20} height={20} className="rounded object-contain" />
            )}
            <Link
              href={`/search?brands=${encodeURIComponent(product.brand)}`}
              className="text-body-sm font-semibold text-gray-500 hover:text-brand uppercase tracking-wide transition-fast"
            >
              {product.brand}
            </Link>
          </div>
        )}
        <h1 className="text-h3 md:text-h1 font-bold text-gray-900 leading-tight">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-0.5 text-brand" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 00-1.176 0L6.34 18.466c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.356 9.827c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
              </svg>
            ))}
          </div>
          <span className="text-body-sm font-medium text-gray-700">4.8</span>
          <span className="text-body-sm text-gray-400">· 24 {t('reviews')}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2.5 flex-wrap p-4 bg-gradient-to-br from-gray-50 to-white rounded-[var(--radius-card)] border border-gray-100">
        <CurrencyPrice cnyPrice={product.price} className="text-h1 font-bold text-price" />
        <span className="text-body-sm text-gray-400 line-through">
          <CurrencyPrice cnyPrice={listPrice} />
        </span>
        {discountPct > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-success/10 text-success">
            {tCommon('save')} {discountPct}%
          </span>
        )}
        {totalStock > 0 && totalStock <= 5 && (
          <span className="text-body-sm font-medium text-warning flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            {t('onlyLeft', { count: totalStock })}
          </span>
        )}
        {totalStock === 0 && (
          <span className="text-body-sm font-medium text-error">{t('outOfStock')}</span>
        )}
      </div>
      <div className="h-px bg-gray-200" />
      <p className="text-body-base text-gray-700 leading-relaxed">
        {product.description || t('noDescription')}
      </p>
      <div className="h-px bg-gray-200" />

      {skuAttributes.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
            {skuAttributes.map(({ key, values }) => (
              <div key={key} className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400 shrink-0">{key === 'Size' ? tCommon('size') : key === 'Color' ? tCommon('color') : key}:</span>
                <span className="font-medium">
                  {values.map((v) => translateSize(v)).join(', ')}
                </span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-200" />
        </>
      )}

      <div className="space-y-2 text-body-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M6.75 20.25V9.75A2.25 2.25 0 019 7.5h6a2.25 2.25 0 012.25 2.25v7.5" />
          </svg>
          <span>{t('freeShipping')}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-info shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <span>{t('shipsFrom')}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span>{t('duties')}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          <span>{t('returns')}</span>
        </div>
      </div>

      <div className="hidden md:block">
        <AddToCartBar
          productId={product.id}
          name={product.name}
          price={product.price}
          imageUrl={product.imageUrl}
          category={product.category}
          inline
        />
      </div>

      <ShareButtons
        url={`${siteUrl}/products/${product.id}`}
        title={product.name}
        image={product.imageUrl}
      />

      <TrustBadges />
    </div>
  );
}