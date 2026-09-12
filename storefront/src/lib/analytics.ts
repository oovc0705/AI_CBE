'use client';

/**
 * GA4 数据追踪工具
 * - 仅在用户同意 Cookie 后动态加载 GA4 script
 * - 封装 trackEvent 自动注入公共参数
 */

const CONSENT_KEY = 'cookie_consent';
const SESSION_KEY = 'analytics_session_id';

/** 获取或生成 session_id */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/** 检查用户是否已同意 Cookie */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'granted';
}

/** 设置 Cookie 同意状态 */
export function setConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  if (granted) {
    loadGA4();
  }
}

/** 获取同意状态：null=未选择, true=同意, false=拒绝 */
export function getConsentStatus(): boolean | null {
  if (typeof window === 'undefined') return null;
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === 'granted') return true;
  if (val === 'denied') return false;
  return null;
}

/** 动态加载 GA4 script（仅在同意后调用） */
let ga4Loaded = false;
let measurementId = '';

export function setMeasurementId(id: string) {
  measurementId = id;
}

function loadGA4() {
  if (ga4Loaded || !measurementId) return;
  ga4Loaded = true;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // 初始化 gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: true });
}

/** 初始化 GA4（读取配置并根据同意状态决定是否加载） */
export async function initGA4() {
  if (typeof window === 'undefined') return;

  try {
    const res = await fetch('/api/storefront/site-config');
    const json = await res.json();
    if (json.code === 200 && json.data?.gaMeasurementId) {
      setMeasurementId(json.data.gaMeasurementId);
      if (hasConsent()) {
        loadGA4();
      }
    }
  } catch {
    // 静默失败，不影响用户体验
  }
}

/**
 * 发送 GA4 事件
 * 自动注入 currency、session_id 等公共参数
 */
export function trackEvent(
  eventName: string,
  params: Record<string, any> = {},
) {
  if (typeof window === 'undefined') return;
  if (!hasConsent() || !ga4Loaded) return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  const commonParams = {
    currency: 'CNY',
    session_id: getSessionId(),
    ...params,
  };

  gtag('event', eventName, commonParams);
}
