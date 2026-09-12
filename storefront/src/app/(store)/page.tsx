import Link from 'next/link';
import type { Metadata } from 'next';
import { buildMetadata, SITE_URL, SITE_NAME } from '@/lib/seo';
import HeroCarousel from './HeroCarousel';
import ScrollHero from './ScrollHero';
import CategoryShowcase from './CategoryShowcase';
import ScrollReveal from './ScrollReveal';
import HomePromoSection from './HomePromoSection';
import TrustBadgesSection from './TrustBadgesSection';
import HomeHeroCompact from './HomeHeroCompact';

export const metadata: Metadata = buildMetadata({
  title: 'Home',
  description: 'Premium running shoes, performance apparel, and accessories. Free worldwide shipping on orders over $99.',
  path: '/',
});

const SHOWCASES = [
  {
    titleKey: 'showcases.shoes.title',
    subtitleKey: 'showcases.shoes.subtitle',
    descriptionKey: 'showcases.shoes.description',
    ctaKey: 'showcases.shoes.cta',
    ctaHref: '/search?category=Shoes',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #F97316 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80',
    reverse: false,
  },
  {
    titleKey: 'showcases.apparel.title',
    subtitleKey: 'showcases.apparel.subtitle',
    descriptionKey: 'showcases.apparel.description',
    ctaKey: 'showcases.apparel.cta',
    ctaHref: '/search?category=Apparel',
    gradient: 'linear-gradient(135deg, #44403C 0%, #78716C 40%, #FB923C 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
    reverse: true,
  },
  {
    titleKey: 'showcases.accessories.title',
    subtitleKey: 'showcases.accessories.subtitle',
    descriptionKey: 'showcases.accessories.description',
    ctaKey: 'showcases.accessories.cta',
    ctaHref: '/search?category=Accessories',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #EA580C 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80',
    reverse: false,
  },
];

export default function HomePage() {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([orgJsonLd, webSiteJsonLd]).replace(/</g, '\\u003c'),
        }}
      />

      {/* Hero Carousel with Scroll Collapse */}
      <ScrollHero
        compactContent={<HomeHeroCompact />}
      >
        <HeroCarousel />
      </ScrollHero>

      {/* Category Showcases — large alternating sections with scroll reveal */}
      {SHOWCASES.map((showcase, i) => (
        <ScrollReveal 
          key={showcase.titleKey} 
          delay={i * 150}
          direction={i === 0 ? 'right' : i === 1 ? 'left' : 'up'}
          duration={800}
        >
          <CategoryShowcase {...showcase} />
        </ScrollReveal>
      ))}

      <HomePromoSection />

      <TrustBadgesSection />
    </>
  );
}
