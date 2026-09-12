import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import AddToCartBar from './AddToCartBar';
import ShareButtons from './ShareButtons';
import TrustBadges from './TrustBadges';
import ViewItemTracker from './ViewItemTracker';
import RelatedProducts from './RelatedProducts';
import Breadcrumb from './Breadcrumb';
import CurrencyPrice from '@/lib/CurrencyPrice';
import { buildMetadata, SITE_URL } from '@/lib/seo';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

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

interface Product {
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
  createdAt?: string;
  updatedAt?: string;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8081';
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch product: ${res.status}`);
    }
    const json = await res.json();
    if (json.code !== 200) return null;
    return json.data;
  } catch {
    return null;
  }
}

/**
 * Aggregate distinct attribute values across all SKUs.
 * e.g. [{Color: "Black", Size: "US 9"}, {Color: "White", Size: "US 10"}]
 *      -> [{ key: "Color", values: ["Black", "White"] }, { key: "Size", values: ["US 9", "US 10"] }]
 */
function aggregateSkuAttributes(
  skus?: ProductSku[],
): { key: string; values: string[] }[] {
  if (!skus || skus.length === 0) return [];
  const attrMap = new Map<string, Set<string>>();
  for (const sku of skus) {
    if (!sku.attributes) continue;
    for (const [k, v] of Object.entries(sku.attributes)) {
      if (!attrMap.has(k)) attrMap.set(k, new Set());
      attrMap.get(k)!.add(String(v));
    }
  }
  return Array.from(attrMap.entries()).map(([key, values]) => ({
    key,
    values: Array.from(values),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return { title: 'Product Not Found', robots: { index: false, follow: false } };
  }
  return buildMetadata({
    title: product.name,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at the best price.`,
    image: product.imageUrl,
    path: `/products/${id}`,
    ogType: 'product',
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Strike-through list price matches the previous ×1.3 heuristic.
  const listPrice = Math.round(product.price * 1.3);
  const discountPct = Math.round((1 - product.price / listPrice) * 100);

  // Aggregate distinct attribute keys and values from SKUs
  const skuAttributes = aggregateSkuAttributes(product.skus);
  const totalStock = product.stock ?? 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.imageUrl || `${SITE_URL}/og-default.png`,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/products/${id}`,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '24',
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12 animate-fade-in pb-28 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Breadcrumb category={product.category} brand={product.brand} productName={product.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
        {/* Image Gallery - swipeable on mobile */}
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-gray-200 bg-white group">
          <div className="relative aspect-square overflow-x-auto snap-x snap-mandatory scroll-smooth flex md:block">
            {product.imageUrl ? (
              <div className="relative w-full h-full shrink-0 snap-center">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority
                />
                {/* Discount badge */}
                {discountPct > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-caption font-bold bg-error text-white shadow-lg">
                      -{discountPct}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full bg-gray-100 aspect-square flex items-center justify-center text-gray-400 text-body-lg">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4 md:gap-5 animate-slide-up">
          <div>
            {/* Brand */}
            {product.brand && (
              <div className="flex items-center gap-2 mb-2">
                {product.brandLogoUrl && (
                  <Image src={product.brandLogoUrl} alt={product.brand} width={20} height={20} className="rounded object-contain" />
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
            {/* Rating row */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5 text-brand" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.539 1.118l-3.366-2.446a1 1 0 00-1.176 0L6.34 18.466c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.356 9.827c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                  </svg>
                ))}
              </div>
              <span className="text-body-sm font-medium text-gray-700">4.8</span>
              <span className="text-body-sm text-gray-400">· 24 reviews</span>
            </div>
          </div>

          {/* Price + discount badge + stock status */}
          <div className="flex items-baseline gap-2.5 flex-wrap p-4 bg-gradient-to-br from-gray-50 to-white rounded-[var(--radius-card)] border border-gray-100">
            <CurrencyPrice cnyPrice={product.price} className="text-h1 font-bold text-price" />
            <span className="text-body-sm text-gray-400 line-through">
              <CurrencyPrice cnyPrice={listPrice} />
            </span>
            {discountPct > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold bg-success/10 text-success">
                Save {discountPct}%
              </span>
            )}
            {/* Stock status */}
            {totalStock > 0 && totalStock <= 5 && (
              <span className="text-body-sm font-medium text-warning flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                Only {totalStock} left in stock
              </span>
            )}
            {totalStock === 0 && (
              <span className="text-body-sm font-medium text-error">Out of Stock</span>
            )}
          </div>
          <div className="h-px bg-gray-200" />
          <p className="text-body-base text-gray-700 leading-relaxed">
            {product.description || 'No description available'}
          </p>
          <div className="h-px bg-gray-200" />

          {/* SKU Attributes Panel — sport specs for running gear */}
          {skuAttributes.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-body-sm">
                {skuAttributes.map(({ key, values }) => (
                  <div key={key} className="flex items-center gap-2 text-gray-600">
                    <span className="text-gray-400 shrink-0">{key}:</span>
                    <span className="font-medium">{values.join(', ')}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-200" />
            </>
          )}

          {/* Cross-border trust info */}
          <div className="space-y-2 text-body-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H18.75M6.75 20.25V9.75A2.25 2.25 0 019 7.5h6a2.25 2.25 0 012.25 2.25v7.5" />
              </svg>
              <span>Free worldwide shipping on orders over $99</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-info shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span>Ships from global warehouses &middot; 7&#8211;15 business days</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>Duties &amp; taxes calculated at checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              <span>7-Day free returns &middot; 30-Day money back guarantee</span>
            </div>
          </div>

          {/* Desktop-only Add to Cart */}
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
            url={`${SITE_URL}/products/${id}`}
            title={product.name}
            image={product.imageUrl}
          />

          {/* Trust Badges */}
          <TrustBadges />
        </div>
      </div>

      {/* Mobile sticky bottom Add to Cart */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30">
        <AddToCartBar
          productId={product.id}
          name={product.name}
          price={product.price}
          imageUrl={product.imageUrl}
          category={product.category}
        />
      </div>

      {/* Related products */}
      <RelatedProducts excludeId={product.id} />

      <ViewItemTracker
        itemId={String(product.id)}
        itemName={product.name}
        price={product.price}
      />
    </div>
  );
}
