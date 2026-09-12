export interface TrustBadge {
  label: string;
  icon: 'shield' | 'truck' | 'refresh' | 'lock' | 'headset';
}

export interface PaymentIcon {
  label: string;
  abbr: string;
}

export const TRUST_BADGES: TrustBadge[] = [
  { label: 'Authentic Guaranteed', icon: 'shield' },
  { label: 'Worldwide Shipping', icon: 'truck' },
  { label: '7-Day Free Returns', icon: 'refresh' },
  { label: 'Secure Checkout', icon: 'lock' },
];

export const PAYMENT_ICONS: PaymentIcon[] = [
  { label: 'Visa', abbr: 'V' },
  { label: 'Mastercard', abbr: 'MC' },
  { label: 'Alipay', abbr: 'Ali' },
  { label: 'WeChat Pay', abbr: 'WX' },
];

export const AFTER_SALES_PROMISES: string[] = [
  '30-Day Money Back',
  'Free Returns',
  '24/7 Support',
];
