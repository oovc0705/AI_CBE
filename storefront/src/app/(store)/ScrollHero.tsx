'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';

interface ScrollHeroProps {
  children: ReactNode;
  /** Compact bar content shown after scroll collapse */
  compactContent: ReactNode;
}

/**
 * ScrollHero wraps the hero carousel and collapses it into a compact
 * branded bar as the user scrolls. Uses transform/opacity for
 * GPU-accelerated performance (no layout thrashing).
 */
export default function ScrollHero({ children, compactContent }: ScrollHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 = expanded, 1 = fully collapsed

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScroll = rect.height;
      const scrolled = Math.max(0, -rect.top);
      setProgress(Math.min(1, scrolled / totalScroll));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Full hero — fades out as user scrolls */}
      <div
        className="transition-none"
        style={{
          opacity: 1 - progress * 1.5, // fade out faster than collapse
          transform: `scale(${1 - progress * 0.05})`,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>

      {/* Compact branded bar — appears as hero collapses */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 pointer-events-none"
        style={{
          opacity: Math.max(0, (progress - 0.5) * 2), // fade in after 50% collapse
        }}
      >
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 pointer-events-auto">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            {compactContent}
          </div>
        </div>
      </div>
    </div>
  );
}
