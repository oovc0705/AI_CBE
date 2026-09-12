'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

export default function HomePromoSection() {
  const t = useTranslations('home');

  return (
    <ScrollReveal direction="fade" duration={900}>
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal direction="left" delay={100}>
            <Link
              href="/search?sort=newest"
              className="group relative overflow-hidden rounded-[var(--radius-card)] min-h-[320px] md:min-h-[400px] flex items-end"
            >
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80)' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
                  <circle cx="300" cy="100" r="80" fill="none" stroke="white" strokeWidth="1" />
                  <path d="M0 200 Q100 150 200 200 T400 200" fill="none" stroke="white" strokeWidth="1" />
                </svg>
              </div>
              <div className="relative z-10 p-8 md:p-10">
                <p className="text-white/60 text-body-sm font-medium tracking-widest uppercase mb-2">{t('newArrivals.tag')}</p>
                <h3 className="text-h2 md:text-[2rem] font-extrabold text-white mb-3">{t('newArrivals.title')}</h3>
                <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:text-brand transition-fast">
                  {t('newArrivals.cta')}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={200}>
            <Link
              href="/search?sort=relevance"
              className="group relative overflow-hidden rounded-[var(--radius-card)] min-h-[320px] md:min-h-[400px] flex items-end"
            >
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80)' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
                  <circle cx="100" cy="300" r="100" fill="none" stroke="white" strokeWidth="1" />
                  <path d="M100 0 Q200 100 100 200 T100 400" fill="none" stroke="white" strokeWidth="1" />
                </svg>
              </div>
              <div className="relative z-10 p-8 md:p-10">
                <p className="text-white/70 text-body-sm font-medium tracking-widest uppercase mb-2">{t('bestSellers.tag')}</p>
                <h3 className="text-h2 md:text-[2rem] font-extrabold text-white mb-3">{t('bestSellers.title')}</h3>
                <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:text-brand transition-fast">
                  {t('bestSellers.cta')}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </ScrollReveal>
  );
}
