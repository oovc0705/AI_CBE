'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CurrencyPrice from '@/lib/CurrencyPrice';

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  brand?: string;
}

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

/**
 * "You May Also Like" grid shown beneath the product details.
 * Reuses the public product list API (same source as the cart page
 * recommendations) — no backend changes required.
 * Excludes the current product so a page never recommends itself.
 */
export default function RelatedProducts({ excludeId }: { excludeId: number }) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/products?page=0&size=8')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || json.code !== 200) return;
        const content: RelatedProduct[] = json.data?.content ?? [];
        // Drop the current product, then keep the first 4.
        setProducts(content.filter((p) => p.id !== excludeId).slice(0, 4));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px bg-gray-200 flex-1" />
        <h2 className="text-h4 font-bold text-gray-900">You May Also Like</h2>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p, idx) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="card-product block group active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevation-2)]"
            style={{ animation: 'slide-up 0.5s ease-out both', animationDelay: `${idx * 80}ms` }}
          >
            <div className="relative overflow-hidden aspect-square">
              {p.imageUrl ? (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              {/* Quick view overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white text-caption font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                  View Details
                </span>
              </div>
            </div>
            <div className="p-3">
              {p.brand && (
                <p className="text-caption text-gray-400 uppercase tracking-wide font-medium">{p.brand}</p>
              )}
              <h3 className="font-medium text-gray-900 text-body-sm truncate group-hover:text-brand transition-fast mt-0.5">
                {p.name}
              </h3>
              <CurrencyPrice cnyPrice={p.price} className="text-body-sm font-bold text-price mt-1 block" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
