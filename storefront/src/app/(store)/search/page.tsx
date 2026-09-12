'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO8cOHCfwAH+gNJ3XpQNAAAAABJRU5ErkJggg==';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

interface FacetItem {
  name: string;
  count: number;
}

interface PriceRangeFacet {
  min: number | null;
  max: number | null;
  count: number;
}

interface SearchData {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  facets: {
    categories: FacetItem[];
    priceRanges: PriceRangeFacet[];
  };
}

interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-body-sm font-semibold text-gray-900 hover:text-brand transition-fast"
      >
        {title}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-1 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors duration-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/30 cursor-pointer transition-all duration-200"
      />
      <span className={`text-body-sm transition-fast ${checked ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
    </label>
  );
}

function SearchPageInner() {
  const t = useTranslations('search');
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const sort = searchParams.get('sort') ?? 'relevance';
  const page = parseInt(searchParams.get('page') ?? '0', 10);
  const brandsParam = searchParams.get('brands') ?? '';

  const selectedBrands = brandsParam ? brandsParam.split(',') : [];

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [brandList, setBrandList] = useState<Brand[]>([]);

  useEffect(() => { setLocalMinPrice(minPrice); }, [minPrice]);
  useEffect(() => { setLocalMaxPrice(maxPrice); }, [maxPrice]);

  const buildUrl = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const merged = { q, category, minPrice, maxPrice, sort, brands: brandsParam, page: '0', ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return `/search?${params.toString()}`;
  }, [q, category, minPrice, maxPrice, sort, brandsParam]);

  const pushFilters = useCallback((overrides: Record<string, string>) => {
    router.push(buildUrl(overrides));
  }, [router, buildUrl]);

  const pushPriceDebounced = useCallback((min: string, max: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushFilters({ minPrice: min, maxPrice: max }), 300);
  }, [pushFilters]);

  const toggleBrand = (brand: string) => {
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    pushFilters({ brands: next.join(','), page: '0' });
  };

  const clearAll = () => {
    pushFilters({ category: '', minPrice: '', maxPrice: '', brands: '', q: '' });
  };

  const hasFilters = category || minPrice || maxPrice || brandsParam;

  useEffect(() => {
    fetch('/api/products/brands')
      .then((r) => r.json())
      .then((json) => { if (json.code === 200) setBrandList(json.data ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (brandsParam) params.set('brands', brandsParam);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('size', '24');

    fetch(`/api/products/search?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 200) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, minPrice, maxPrice, brandsParam, sort, page]);

  useEffect(() => {
    if (data && data.content.length === 0) {
      fetch('/api/products?page=0&size=4')
        .then((r) => r.json())
        .then((json) => { if (json.code === 200) setRecommendations(json.data.content ?? []); })
        .catch(() => {});
    }
  }, [data]);

  const results = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const filterContent = (
    <>
      <FilterSection title={t('brand')}>
        {brandList.map((brand) => (
          <CheckItem
            key={brand.slug}
            label={brand.name}
            checked={selectedBrands.includes(brand.name)}
            onChange={() => toggleBrand(brand.name)}
          />
        ))}
      </FilterSection>

      <FilterSection title={t('category')}>
        {(data?.facets?.categories ?? []).map((item) => {
          const active = category === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => pushFilters({ category: active ? '' : item.name, page: '0' })}
              className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-body-sm rounded-[var(--radius-btn)] transition-fast ${
                active ? 'bg-brand/10 text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.name}</span>
              <span className="text-caption text-gray-400">({item.count})</span>
            </button>
          );
        })}
      </FilterSection>

      <FilterSection title={t('price')}>
        {(data?.facets?.priceRanges ?? []).map((pr) => {
          const min = pr.min != null ? String(pr.min) : '';
          const max = pr.max != null ? String(pr.max) : '';
          const active = min === minPrice && max === maxPrice;
          const label = max ? `$${min} – $${max}` : `$${min}+`;
          return (
            <button
              key={label}
              type="button"
              onClick={() => pushFilters({ minPrice: min, maxPrice: max, page: '0' })}
              className={`flex items-center justify-between w-full text-left px-3 py-1.5 text-body-sm rounded-[var(--radius-btn)] transition-fast ${
                active ? 'bg-brand/10 text-brand font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{label}</span>
              <span className="text-caption text-gray-400">({pr.count})</span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="number"
            value={localMinPrice}
            onChange={(e) => { setLocalMinPrice(e.target.value); pushPriceDebounced(e.target.value, localMaxPrice); }}
            placeholder={t('min')}
            className="input-field w-20 text-body-sm py-1.5"
            min={0}
          />
          <span className="text-gray-400 text-caption">–</span>
          <input
            type="number"
            value={localMaxPrice}
            onChange={(e) => { setLocalMaxPrice(e.target.value); pushPriceDebounced(localMinPrice, e.target.value); }}
            placeholder={t('max')}
            className="input-field w-20 text-body-sm py-1.5"
            min={0}
          />
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-h4 md:text-h4 font-bold text-gray-900 truncate">
            {q ? t('resultsFor', { query: q }) : category || t('allProducts')}
          </h1>
          {total > 0 && <p className="text-body-sm text-gray-400 mt-1">{total} {total !== 1 ? t('products_plural') : t('products')}</p>}
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-body-sm font-medium text-gray-700 border border-gray-200 rounded-[var(--radius-btn)] hover:border-brand transition-fast min-h-[40px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            {t('filters')}
          </button>
          <select
            value={sort}
            onChange={(e) => pushFilters({ sort: e.target.value })}
            className="select-field text-body-sm py-2 min-w-[120px] md:min-w-[140px]"
          >
            <option value="relevance">{t('relevance')}</option>
            <option value="price_asc">{t('priceLowHigh')}</option>
            <option value="price_desc">{t('priceHighLow')}</option>
            <option value="newest">{t('newest')}</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-caption font-medium bg-brand/10 text-brand rounded-full">
              {category}
              <button type="button" onClick={() => pushFilters({ category: '' })} className="hover:text-brand-dark">&times;</button>
            </span>
          )}
          {selectedBrands.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 text-caption font-medium bg-gray-100 text-gray-700 rounded-full">
              {b}
              <button type="button" onClick={() => toggleBrand(b)} className="hover:text-error">&times;</button>
            </span>
          ))}
          <button type="button" onClick={clearAll} className="text-caption text-gray-400 hover:text-error transition-fast ml-1">
            {t('clearAll')}
          </button>
        </div>
      )}

      <div className="flex gap-6 md:gap-8">
        <aside className="hidden lg:block w-[240px] shrink-0">
          <div className="sticky top-[80px]">
            {filterContent}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-product animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/3 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {results.map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="card-product block group active:scale-95 transition-default hover:shadow-[var(--shadow-elevation-2)] hover:-translate-y-1 duration-300"
                  style={{ animation: 'slide-up 0.5s ease-out both', animationDelay: `${Math.min(idx * 60, 600)}ms` }}
                >
                  <div className="relative overflow-hidden aspect-square">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                        priority={idx < 6}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {product.category && (
                      <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-0.5 rounded-full shadow-sm">
                        {product.category}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                      <span className="text-white text-caption font-medium bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        Quick View
                      </span>
                    </div>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-gray-900 text-body-sm md:text-body-base truncate group-hover:text-brand transition-fast">
                      {product.name}
                    </h3>
                    <p className="text-body-sm text-gray-500 line-clamp-1 mt-1">{product.description || 'No description'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-body-base font-bold text-price">${product.price}</p>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-caption text-brand font-medium">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && total > 24 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 0 && (
                <button type="button" onClick={() => pushFilters({ page: String(page - 1) })} className="btn-outline px-4 py-2 text-body-sm">
                  {t('previous')}
                </button>
              )}
              <span className="flex items-center px-4 text-body-sm text-gray-500">
                {t('page', { current: page + 1, total: data?.totalPages ?? 1 })}
              </span>
              {page < (data?.totalPages ?? 1) - 1 && (
                <button type="button" onClick={() => pushFilters({ page: String(page + 1) })} className="btn-outline px-4 py-2 text-body-sm">
                  {t('next')}
                </button>
              )}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-20 card-content animate-scale-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center ring-8 ring-gray-50">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-700 text-h5 font-bold mb-2">{t('noResults', { query: q ? ` "${q}"` : '' })}</p>
              <p className="text-body-sm text-gray-400 mb-10">{t('tryAdjusting')}</p>
              {recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 justify-center mb-6">
                    <div className="h-px bg-gray-200 flex-1 max-w-[80px]" />
                    <h2 className="text-h5 font-bold text-gray-900">{t('youMayAlsoLike')}</h2>
                    <div className="h-px bg-gray-200 flex-1 max-w-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {recommendations.map((p, idx) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        className="card-product block group active:scale-95 transition-default hover:-translate-y-1 hover:shadow-[var(--shadow-elevation-2)] duration-300"
                        style={{ animation: 'slide-up 0.5s ease-out both', animationDelay: `${idx * 80}ms` }}
                      >
                        <div className="relative overflow-hidden aspect-square">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                          )}
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
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[320px] bg-white shadow-[var(--shadow-elevation-3)] animate-slide-right overflow-y-auto scroll-touch safe-area-bottom">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-h5">{t('filters')}</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-fast active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-6">
              {filterContent}
              {hasFilters && (
                <button type="button" onClick={() => { clearAll(); setMobileFiltersOpen(false); }} className="btn-outline w-full mt-4 text-body-sm min-h-[44px]">
                  {t('clearAllFilters')}
                </button>
              )}
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="btn-primary w-full mt-3 text-body-sm min-h-[44px] lg:hidden">
                {t('showResults')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="flex gap-8">
          <div className="hidden lg:block w-[240px] space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />)}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card-product animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}