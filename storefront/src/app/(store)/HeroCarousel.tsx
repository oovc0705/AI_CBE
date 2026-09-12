'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Slide {
  id: number;
  titleKey: string;
  subtitleKey: string;
  ctaKey: string;
  ctaHref: string;
  gradient: string;
  imageUrl?: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    titleKey: 'hero.slide1.title',
    subtitleKey: 'hero.slide1.subtitle',
    ctaKey: 'hero.slide1.cta',
    ctaHref: '/search?category=Shoes',
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #F97316 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80',
  },
  {
    id: 2,
    titleKey: 'hero.slide2.title',
    subtitleKey: 'hero.slide2.subtitle',
    ctaKey: 'hero.slide2.cta',
    ctaHref: '/search?category=Apparel',
    gradient: 'linear-gradient(135deg, #1C1917 0%, #44403C 50%, #F97316 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
  },
  {
    id: 3,
    titleKey: 'hero.slide3.title',
    subtitleKey: 'hero.slide3.subtitle',
    ctaKey: 'hero.slide3.cta',
    ctaHref: '/search?category=Accessories',
    gradient: 'linear-gradient(135deg, #020617 0%, #334155 40%, #FB923C 100%)',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80',
  },
];

const AUTOPLAY_INTERVAL = 5000;

export default function HeroCarousel() {
  const t = useTranslations('home');
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const total = SLIDES.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setPaused(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(400px, 75vh, 720px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Promotional slides"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {SLIDES.map((slide, idx) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            opacity: idx === current ? 1 : 0,
            transform: idx === current ? 'scale(1)' : 'scale(1.05)',
            zIndex: idx === current ? 1 : 0,
          }}
          aria-hidden={idx !== current}
        >
          {/* Background */}
          {slide.imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.imageUrl})` }}
            />
          ) : (
            <div className="absolute inset-0" style={{ background: slide.gradient }} />
          )}

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Decorative running SVG pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <path d="M0 300 Q200 200 400 300 T800 300" fill="none" stroke="white" strokeWidth="2" />
              <path d="M0 350 Q200 250 400 350 T800 350" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="600" cy="200" r="80" fill="none" stroke="white" strokeWidth="1" />
              <circle cx="600" cy="200" r="120" fill="none" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      ))}

      {/* Content overlay — always on top */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
        {SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-500"
            style={{
              opacity: idx === current ? 1 : 0,
              transform: idx === current ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <p className="text-white/80 text-body-sm tracking-widest uppercase mb-3 font-medium">
              {t('hero.brand')}
            </p>
            <h2 className="text-h1 md:text-[3rem] lg:text-[3.5rem] font-extrabold text-white mb-4 leading-tight max-w-2xl">
              {t(slide.titleKey)}
            </h2>
            <p className="text-white/80 text-body-base md:text-body-lg max-w-lg mb-8">
              {t(slide.subtitleKey)}
            </p>
            <Link
              href={slide.ctaHref}
              className="btn-primary px-10 py-3.5 text-body-base"
            >
              {t(slide.ctaKey)}
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-fast active:scale-90"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-fast active:scale-90"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goTo(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1 animate-bounce-slow">
        <span className="text-white/60 text-caption">Scroll</span>
        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}
