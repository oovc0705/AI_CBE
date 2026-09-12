import type { Metadata } from 'next';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://mystore.com';

export const SITE_NAME = 'MyStore';
export const DEFAULT_TITLE_SUFFIX = ` - ${SITE_NAME}`;
export const DEFAULT_DESCRIPTION =
  'Premium quality products at affordable prices. Shop now at MyStore.';
export const DEFAULT_OG_IMAGE = '/og-default.png';

/**
 * Build a page-level Metadata object that inherits global defaults
 * but allows per-page overrides.
 */
export function buildMetadata(overrides: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
  ogType?: string;
  twitterSite?: string;
}): Metadata {
  const fullTitle = `${overrides.title}${DEFAULT_TITLE_SUFFIX}`;
  const description = overrides.description ?? DEFAULT_DESCRIPTION;
  const image = overrides.image ?? DEFAULT_OG_IMAGE;
  const url = overrides.path ? `${SITE_URL}${overrides.path}` : SITE_URL;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    alternates: {
      canonical: overrides.path ? `${SITE_URL}${overrides.path}` : SITE_URL,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: overrides.title }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      ...(overrides.twitterSite ? { site: overrides.twitterSite, creator: overrides.twitterSite } : {}),
    },
    robots: overrides.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };

  // og:type 字段通过 other 属性注入，支持 Next.js 未内置的类型如 'product'
  if (overrides.ogType && overrides.ogType !== 'website') {
    (metadata as any).other = {
      ...((metadata as any).other || {}),
      'og:type': overrides.ogType,
    };
  }

  return metadata;
}

/**
 * Root-level metadata template used by the root layout.
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
};
