'use client';

/**
 * Web Vitals auto-reporting utility.
 * Reports LCP, FID, CLS, FCP, TTFB, INP to GA4 as custom events.
 * Uses the native PerformanceObserver API — no external dependency needed.
 */

import { trackEvent } from './analytics';

type MetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';

interface MetricEntry {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function getRating(name: MetricName, value: number): MetricEntry['rating'] {
  const thresholds: Record<MetricName, [number, number]> = {
    CLS:  [0.1,  0.25],
    FCP:  [1800, 3000],
    FID:  [100,  300],
    INP:  [200,  500],
    LCP:  [2500, 4000],
    TTFB: [800,  1800],
  };
  const [good, poor] = thresholds[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(name: MetricName, value: number) {
  const rating = getRating(name, value);
  trackEvent('web_vitals', {
    metric_name: name,
    metric_value: Math.round(name === 'CLS' ? value * 1000 : value),
    metric_rating: rating,
  });
}

/** Observe a single metric via PerformanceObserver */
function observe(type: string, name: MetricName, buffered = true) {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (!entries.length) return;

      if (name === 'CLS') {
        // CLS = sum of layout shift values (without recent input)
        let clsValue = 0;
        for (const e of entries) {
          if (!(e as any).hadRecentInput) {
            clsValue += (e as any).value ?? 0;
          }
        }
        reportMetric(name, clsValue);
      } else if (name === 'LCP') {
        // LCP = last entry's startTime
        const last = entries[entries.length - 1];
        reportMetric(name, last.startTime);
      } else if (name === 'FID') {
        const first = entries[0] as PerformanceEventTiming;
        reportMetric(name, first.processingStart - first.startTime);
      } else if (name === 'FCP') {
        reportMetric(name, entries[0].startTime);
      } else if (name === 'INP') {
        // INP = max duration among all interactions
        let maxDuration = 0;
        for (const e of entries) {
          if (e.duration > maxDuration) maxDuration = e.duration;
        }
        reportMetric(name, maxDuration);
      } else if (name === 'TTFB') {
        const nav = entries[0] as PerformanceNavigationTiming;
        reportMetric(name, nav.responseStart - nav.requestStart);
      }
    });

    po.observe({ type, buffered });
  } catch {
    // Metric not supported in this browser — silent
  }
}

let initialized = false;

/** Initialize all Web Vitals observers. Call once in app root. */
export function initWebVitals() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  observe('layout-shift', 'CLS');
  observe('largest-contentful-paint', 'LCP');
  observe('first-input', 'FID');
  observe('paint', 'FCP');
  observe('event', 'INP');
  observe('navigation', 'TTFB');
}
