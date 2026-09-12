'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CategoryShowcaseProps {
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  ctaKey: string;
  ctaHref: string;
  gradient: string;
  imageUrl?: string;
  /** When true, image is on the right side (alternating layout) */
  reverse?: boolean;
}

/**
 * Full-bleed category showcase section with large image and text overlay.
 * Alternates left/right layout for visual rhythm (Apple/Nike style).
 */
export default function CategoryShowcase({
  titleKey,
  subtitleKey,
  descriptionKey,
  ctaKey,
  ctaHref,
  gradient,
  imageUrl,
  reverse = false,
}: CategoryShowcaseProps) {
  const t = useTranslations('home');
  return (
    <section className="relative w-full overflow-hidden">
      <div className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[480px] md:min-h-[560px] ${reverse ? 'lg:direction-rtl' : ''}`}>
        {/* Image Side */}
        <div className={`relative aspect-[4/3] lg:aspect-auto overflow-hidden ${reverse ? 'lg:order-2' : ''}`}>
          {imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: gradient }} />
          )}
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-[0.07]">
            <svg className="w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
              <circle cx={reverse ? 100 : 500} cy="200" r="150" fill="none" stroke="white" strokeWidth="1" />
              <circle cx={reverse ? 100 : 500} cy="200" r="200" fill="none" stroke="white" strokeWidth="0.5" />
              <path d={reverse ? 'M600 100 Q400 200 600 300' : 'M0 100 Q200 200 0 300'} fill="none" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* Text Side */}
        <div className={`flex flex-col justify-center px-8 md:px-16 py-12 lg:py-0 bg-white ${reverse ? 'lg:order-1' : ''}`}>
          <p className="text-brand font-semibold text-body-sm tracking-widest uppercase mb-3">
            {t(subtitleKey)}
          </p>
          <h2 className="text-h2 md:text-[2.5rem] font-extrabold text-gray-900 mb-4 leading-tight">
            {t(titleKey)}
          </h2>
          <p className="text-body-base text-gray-500 leading-relaxed mb-8 max-w-md">
            {t(descriptionKey)}
          </p>
          <div>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 text-brand font-semibold text-body-base hover:text-brand-dark transition-fast group"
            >
              {t(ctaKey)}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
