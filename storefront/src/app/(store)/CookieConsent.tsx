'use client';

import { useEffect, useState } from 'react';
import { getConsentStatus, setConsent } from '@/lib/analytics';

/**
 * Cookie Consent Banner - 极简纯 CSS 实现，无第三方库
 * 同意状态存 localStorage，一经选择即隐藏
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 仅在用户未做选择时显示
    if (getConsentStatus() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setConsent(false);
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1f2937',
        color: '#f3f4f6',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
        fontSize: '14px',
      }}
    >
      <p style={{ margin: 0, maxWidth: '600px', lineHeight: '1.5' }}>
        We use cookies to analyze site traffic. By clicking &quot;Accept&quot;, you consent to our use of analytics cookies.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleAccept}
          style={{
            padding: '8px 20px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleDecline}
          style={{
            padding: '8px 20px',
            backgroundColor: 'transparent',
            color: '#d1d5db',
            border: '1px solid #6b7280',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
