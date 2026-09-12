/**
 * 跨境支付方式配置（仅 UI / 演示用，不调用真实网关）
 * 与后端 OrderController / V9 迁移的取值保持一致：
 *   CARD | PAYPAL | WECHAT | ALIPAY | STRIPE
 */
export type PaymentMethodCode = 'CARD' | 'PAYPAL' | 'WECHAT' | 'ALIPAY' | 'STRIPE';

export interface PaymentMethodMeta {
  code: PaymentMethodCode;
  label: string;
  /** Tailwind 主色（用于选中态徽章） */
  badgeClass: string;
  /** 简短说明 */
  description: string;
  /** 是否国际通用 */
  region: 'global' | 'cn' | 'global';
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  {
    code: 'CARD',
    label: 'Credit / Debit Card',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Visa · Mastercard · Amex · JCB. Supports 3-D Secure.',
    region: 'global',
  },
  {
    code: 'PAYPAL',
    label: 'PayPal',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Pay in 4 installments available. Buyer protection included.',
    region: 'global',
  },
  {
    code: 'STRIPE',
    label: 'Stripe',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    description: 'Apple Pay · Google Pay via Stripe. 135+ currencies.',
    region: 'global',
  },
  {
    code: 'WECHAT',
    label: 'WeChat Pay',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
    description: '微信支付 — 适合中国大陆买家。CNY / USD settle.',
    region: 'cn',
  },
  {
    code: 'ALIPAY',
    label: 'Alipay',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    description: '支付宝 — 支持跨境人民币结算。HK / CN available.',
    region: 'cn',
  },
];

export function getPaymentMethod(code: string): PaymentMethodMeta | undefined {
  return PAYMENT_METHODS.find((m) => m.code === code);
}
