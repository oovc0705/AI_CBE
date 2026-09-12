import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

interface ProductSitemapItem {
  id: number;
  updatedAt: string;
}

async function getProductSitemapData(): Promise<ProductSitemapItem[]> {
  try {
    const res = await fetch(
      `${process.env.API_BASE_URL || 'http://localhost:8081'}/api/products/sitemap-data`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (json.code !== 200) return [];
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProductSitemapData();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/shipping-policy`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/refund-policy`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/terms-of-service`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/policies/privacy-policy`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
