'use client';

import { useEffect } from 'react';
import { initGA4 } from '@/lib/analytics';
import { initWebVitals } from '@/lib/web-vitals';

/**
 * AnalyticsProvider - initializes GA4 and Web Vitals at the app root.
 * GA4 script only loads after user consents to cookies.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initGA4();
    initWebVitals();
  }, []);

  return <>{children}</>;
}
