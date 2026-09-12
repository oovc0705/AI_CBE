'use client';

import { useTranslations } from 'next-intl';
import ScrollReveal from './ScrollReveal';

interface Badge {
  icon: string;
  titleKey: string;
  subKey: string;
}

const BADGES: Badge[] = [
  { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', titleKey: 'trustBadges.shipping.title', subKey: 'trustBadges.shipping.sub' },
  { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', titleKey: 'trustBadges.returns.title', subKey: 'trustBadges.returns.sub' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', titleKey: 'trustBadges.authentic.title', subKey: 'trustBadges.authentic.sub' },
  { icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', titleKey: 'trustBadges.support.title', subKey: 'trustBadges.support.sub' },
];

export default function TrustBadgesSection() {
  const t = useTranslations('home');

  return (
    <ScrollReveal direction="up" duration={800}>
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES.map((badge, index) => (
            <ScrollReveal 
              key={badge.titleKey} 
              delay={index * 100}
              direction="up"
              duration={600}
            >
              <div className="card-content text-center py-8 hover:shadow-lg transition-shadow duration-300">
                <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-brand/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={badge.icon} />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-body-sm">{t(badge.titleKey)}</p>
                <p className="text-caption text-gray-400 mt-1">{t(badge.subKey)}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
