/**
 * Cross-border E-commerce Admin Contract Definitions
 *
 * Single source of truth for:
 * - Unified API response format
 * - Business entity types (Product, Order, SupportRequest, Settings)
 * - Order status enums & fulfillment state machine
 * - Form validation rules
 */

// ======================== API Response Contract ========================

export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ======================== Product & Variants ========================

export interface ProductTranslation {
  locale: string; // e.g. 'en', 'zh', 'ja'
  name: string;
  description?: string;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  attributes: Record<string, string>; // e.g. { color: 'Red', size: 'L' }
  price: number;
  stock: number;
  enabled: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  translations?: ProductTranslation[];
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string;
  translations?: ProductTranslation[];
  variants?: ProductVariant[];
}

export interface ProductImportError {
  row: number;
  source: string;
  reason: string;
}

export interface ProductImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: ProductImportError[];
}

// ======================== Order & Fulfillment ========================

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type FulfillmentStatus =
  | 'UNFULFILLED'
  | 'PARTIAL'
  | 'FULFILLED';

export interface TrackingEvent {
  timestamp: string;
  location?: string;
  description: string;
}

export interface ShipmentTracking {
  id?: number;
  carrier: string; // e.g. 'DHL', 'FedEx', 'SF Express'
  trackingNumber: string;
  status: string; // 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION'
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface RefundRequest {
  id?: number;
  orderId: number;
  reason: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  fulfillmentStatus?: FulfillmentStatus;
  tracking?: ShipmentTracking[];
  refund?: RefundRequest;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  shippingAddress?: Record<string, string>;
  discountAmount?: number;
  stripeSessionId?: string;
}

export type SupportRequestType = 'GENERAL' | 'REFUND' | 'EXCHANGE' | 'COMPLAINT' | 'SHIPPING' | 'ORDER_ISSUE';
export type SupportRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportRequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface SupportRequest {
  id: number;
  orderId?: number;
  userId?: number;
  type: SupportRequestType;
  subject: string;
  message: string;
  status: SupportRequestStatus;
  priority: SupportRequestPriority;
  contactEmail?: string;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: number;
  aiSuggestedReply?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
  userEmail?: string;
  orderNo?: string;
}

// ======================== Store Settings ========================

export interface StoreSettings {
  storeName: string;
  storeUrl: string;
  contactEmail: string;
  currency: string; // 'USD' | 'EUR' | 'GBP' etc.
  timezone: string;
  logo?: string;
}

export interface PaymentGateway {
  id: string; // 'stripe' | 'paypal' | 'alipay'
  name: string;
  enabled: boolean;
  connected: boolean;
  lastFourDigits?: string; // masked for security
}

// ======================== Site Config ========================

export interface SiteConfig {
  id: number;
  titleSuffix: string;
  descriptionTemplate: string;
  ogImageUrl: string;
  gaMeasurementId: string;
  twitterHandle: string;
  updatedAt: string;
}

// ======================== Category ========================

export interface Category {
  id: number;
  parentId?: number;
  nameI18n?: Record<string, string>;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// ======================== Brand ========================

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ======================== Coupon ========================

export type CouponType = 'PERCENTAGE' | 'FIXED';

export interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  usageLimit: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ======================== Admin User ========================

export type UserRoleType = 'CUSTOMER' | 'ADMIN';

export interface AdminUser {
  id: number;
  email: string;
  role: UserRoleType;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ======================== Subscriber ========================

export interface Subscriber {
  id: number;
  email: string;
  source?: string;
  active?: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
}

// ======================== Enum Maps ========================

export const ORDER_STATUS_MAP: Record<OrderStatus, { text: string; status: string }> = {
  PENDING:   { text: '待付款',   status: 'Warning' },
  PAID:      { text: '已付款',   status: 'Success' },
  SHIPPED:   { text: '已发货',   status: 'Processing' },
  COMPLETED: { text: '已完成',   status: 'Default' },
  CANCELLED: { text: '已取消',   status: 'Error' },
  REFUNDED:  { text: '已退款',   status: 'Error' },
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING:   'warning',
  PAID:      'success',
  SHIPPED:   'processing',
  COMPLETED: 'default',
  CANCELLED: 'error',
  REFUNDED:  'error',
};

export const FULFILLMENT_STATUS_MAP: Record<FulfillmentStatus, { text: string; color: string }> = {
  UNFULFILLED: { text: '未发货', color: 'warning' },
  PARTIAL:     { text: '部分发货', color: 'processing' },
  FULFILLED:   { text: '已发货', color: 'success' },
};

export const SUPPORTED_LOCALES = [
  { key: 'en', label: 'English' },
  { key: 'zh', label: '中文' },
  { key: 'ja', label: '日本語' },
  { key: 'es', label: 'Español' },
  { key: 'fr', label: 'Français' },
  { key: 'de', label: 'Deutsch' },
] as const;

export const SUPPORT_REQUEST_TYPE_TEXT: Record<SupportRequestType, string> = {
  GENERAL:     '一般咨询',
  REFUND:      '退款申请',
  EXCHANGE:    '换货申请',
  COMPLAINT:   '投诉建议',
  SHIPPING:    '物流查询',
  ORDER_ISSUE: '订单问题',
};

export const SUPPORT_REQUEST_STATUS_COLOR: Record<SupportRequestStatus, string> = {
  OPEN:        'orange',
  IN_PROGRESS: 'blue',
  RESOLVED:    'green',
  CLOSED:      'default',
};

export const SUPPORT_REQUEST_STATUS_TEXT: Record<SupportRequestStatus, string> = {
  OPEN:        '待处理',
  IN_PROGRESS: '处理中',
  RESOLVED:    '已解决',
  CLOSED:      '已关闭',
};

export const SUPPORT_REQUEST_PRIORITY_COLOR: Record<SupportRequestPriority, string> = {
  LOW:    'default',
  NORMAL: 'blue',
  HIGH:   'orange',
  URGENT: 'red',
};

export const SUPPORT_REQUEST_PRIORITY_TEXT: Record<SupportRequestPriority, string> = {
  LOW:    '低',
  NORMAL: '普通',
  HIGH:   '高',
  URGENT: '紧急',
};

export const COUPON_TYPE_MAP: Record<CouponType, { text: string }> = {
  PERCENTAGE: { text: '百分比折扣' },
  FIXED:      { text: '固定金额减免' },
};

export const USER_ROLE_MAP: Record<UserRoleType, { text: string; color: string }> = {
  CUSTOMER: { text: '客户', color: 'default' },
  ADMIN:    { text: '管理员', color: 'blue' },
};

// ======================== Form Validation Rules ========================

export const productValidationRules = {
  sku: [
    { required: true, message: 'SKU 为必填项' },
    {
      pattern: /^[A-Za-z0-9_-]{1,50}$/,
      message: 'SKU 仅允许字母、数字、连字符和下划线（最多50字符）',
    },
  ],
  name: [
    { required: true, message: '商品名称为必填项' },
    { max: 200, message: '商品名称最多200个字符' },
  ],
  price: [
    { required: true, message: '价格为必填项' },
  ],
  stock: [
    { required: true, message: '库存为必填项' },
  ],
} as const;

export const PRICE_CONSTRAINTS = {
  min: 0.01,
  max: 999999.99,
  precision: 2,
} as const;

export const STOCK_CONSTRAINTS = {
  min: 0,
  max: 999999,
  precision: 0,
} as const;

// ======================== RBAC Roles ========================

export type AdminRole = 'admin' | 'operator' | 'viewer';

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  admin:    ['products.read', 'products.write', 'products.delete', 'orders.read', 'orders.write', 'settings.read', 'settings.write'],
  operator: ['products.read', 'products.write', 'orders.read', 'orders.write'],
  viewer:   ['products.read', 'orders.read'],
};

// ======================== Shipping Templates ========================

export type BillingType = 'weight' | 'piece';

export interface ShippingRule {
  id?: string;
  region: string;
  first_unit: number;
  first_fee: number;
  additional_unit?: number;
  additional_fee?: number;
}

export interface ShippingTemplate {
  id: string;
  name: string;
  is_default: boolean;
  billing_type: BillingType;
  free_shipping_threshold?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  rules: ShippingRule[];
}

// ======================== Payment Gateway Config ========================

export type GatewayType = 'stripe' | 'paypal' | 'alipay' | 'wechatpay' | 'other';
export type GatewayEnvironment = 'sandbox' | 'production';

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  gateway_type: GatewayType;
  environment: GatewayEnvironment;
  is_default: boolean;
  enabled: boolean;
  config: Record<string, any>;
  credentials: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  order_id?: string;
  gateway_id?: string;
  transaction_no?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  raw_request?: Record<string, any>;
  raw_response?: Record<string, any>;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

// ======================== Product Reviews ========================

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewDetail {
  id: string;
  product_id?: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  rating: number;
  content?: string;
  images?: string[];
  status: ReviewStatus;
  merchant_reply?: string;
  merchant_reply_at?: string;
  created_at: string;
  updated_at: string;
}

// ======================== Marketing Promotions ========================

export type PromotionType = 'flash_sale' | 'full_reduction' | 'discount' | 'coupon';

export interface Promotion {
  id: string;
  name: string;
  promotion_type: PromotionType;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  threshold_amount?: number;
  reduction_amount?: number;
  start_time?: string;
  end_time?: string;
  product_ids?: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  template_key: string;
  subject_template: string;
  body_template: string;
  variables?: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface EmailCampaign {
  id: string;
  name: string;
  template_id?: string;
  subject?: string;
  content?: string;
  recipient_filter?: Record<string, any>;
  scheduled_at?: string;
  sent_at?: string;
  status: CampaignStatus;
  total_recipients?: number;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  created_at: string;
  updated_at: string;
}

// ======================== RBAC ========================

export interface RoleDefinition {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  password_hash?: string;
  real_name?: string;
  email?: string;
  phone?: string;
  role_id?: string;
  role?: RoleDefinition;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// ======================== Audit Logs ========================

export interface AuditLogEntry {
  timestamp: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  detail?: Record<string, any>;
}

// ======================== Notifications ========================

export type NotificationType = 'new_order' | 'stock_warning' | 'refund_request' | 'review_pending' | 'system';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

// ======================== Knowledge Base ========================

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'url';
export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'ready' | 'failed';

export interface KnowledgeDoc {
  id: string;
  title: string;
  collection?: string;
  document_type: DocumentType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  content?: string;
  source?: string;
  chunk_count?: number;
  status: DocumentStatus;
  error_message?: string;
  trained_at?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FaqEntry {
  id: string;
  category?: string;
  question: string;
  answer: string;
  sort_order?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ======================== Copilot Sessions ========================

export interface CopilotSessionItem {
  id: string;
  user_id?: string;
  title: string;
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CopilotMessageItem {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  meta?: Record<string, any>;
  created_at: string;
}

export interface CopilotOperationItem {
  id: string;
  session_id: string;
  message_id?: string;
  tool_name: string;
  args?: Record<string, any>;
  result?: any;
  success: boolean;
  error_message?: string;
  duration_ms?: number;
  created_at: string;
}

// ======================== Review Stats ========================

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating: number;
}

// ======================== Currencies ========================

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  decimals: number;
  is_default: boolean;
  enabled: boolean;
  rate_updated_at?: string;
  created_at: string;
  updated_at: string;
}

// ======================== Translations ========================

export interface TranslationKey {
  id: string;
  key: string;
  namespace: string;
  description?: string;
  translations: Record<string, string>;
  translated_locales: string[];
  created_at: string;
  updated_at: string;
}

export interface TranslationStats {
  total_keys: number;
  locales: Record<string, { translated: number; total: number; progress: number }>;
}

// ======================== Tax Rules ========================

export type TaxType = 'vat' | 'sales_tax' | 'gst' | 'none';

export interface TaxRule {
  id: string;
  name: string;
  country_code: string;
  region_code?: string;
  tax_rate: number;
  tax_type: TaxType;
  is_shipping_taxable: boolean;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface TaxCalculation {
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  total: number;
  applied_rules: Array<{ name: string; rate: number; tax: number }>;
}

// ======================== Shipping Carriers ========================

export type CarrierApiType = 'manual' | '17track' | 'aftership' | 'webhook' | 'custom';

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  contact_phone?: string;
  website?: string;
  tracking_url_template?: string;
  api_type: CarrierApiType;
  api_config?: Record<string, any>;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
