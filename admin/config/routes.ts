/**
 * @name umi routes configuration
 * @description Cross-border e-commerce Admin panel routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
    ],
  },
  // ==================== Dashboard - Home ====================
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    access: 'canView',
    component: './dashboard',
  },
  // ==================== E-commerce business routes ====================
  {
    path: '/products',
    name: 'products',
    icon: 'shopping',
    access: 'canView',
    component: './products',
  },
  {
    path: '/orders',
    name: 'orders',
    icon: 'fileText',
    access: 'canView',
    component: './orders',
  },
  {
    path: '/orders/:id',
    name: 'order-detail',
    hideInMenu: true,
    access: 'canView',
    component: './orders/[id]',
  },
  {
    path: '/support',
    name: 'support',
    icon: 'customerService',
    access: 'canView',
    component: './support',
  },
  {
    path: '/support/:id',
    name: 'support-detail',
    hideInMenu: true,
    access: 'canView',
    component: './support/[id]',
  },
  {
    path: '/settings',
    name: 'settings',
    icon: 'setting',
    access: 'canAdmin',
    component: './settings',
  },
  {
    path: '/categories',
    name: 'categories',
    icon: 'appstore',
    access: 'canAdmin',
    component: './categories',
  },
  {
    path: '/brands',
    name: 'brands',
    icon: 'tags',
    access: 'canAdmin',
    component: './brands',
  },
  {
    path: '/coupons',
    name: 'coupons',
    icon: 'gift',
    access: 'canAdmin',
    component: './coupons',
  },
  {
    path: '/users',
    name: 'users',
    icon: 'team',
    access: 'canAdmin',
    component: './users',
  },
  {
    path: '/subscribers',
    name: 'subscribers',
    icon: 'mail',
    access: 'canAdmin',
    component: './subscribers',
  },
  // ==================== New Admin Management Features ====================
  {
    path: '/shipping',
    name: 'shipping',
    icon: 'car',
    access: 'canAdmin',
    component: './Shipping',
  },
  {
    path: '/payment',
    name: 'payment',
    icon: 'creditCard',
    access: 'canAdmin',
    component: './Payment',
  },
  {
    path: '/reviews',
    name: 'reviews',
    icon: 'star',
    access: 'canView',
    component: './Reviews',
  },
  {
    path: '/marketing',
    name: 'marketing',
    icon: 'fire',
    access: 'canAdmin',
    component: './Marketing',
  },
  {
    path: '/export',
    name: 'export',
    icon: 'download',
    access: 'canAdmin',
    component: './DataExport',
  },
  {
    path: '/rbac',
    name: 'rbac',
    icon: 'safety',
    access: 'canAdmin',
    component: './RBAC',
  },
  {
    path: '/audit',
    name: 'audit',
    icon: 'history',
    access: 'canAdmin',
    component: './Audit',
  },
  {
    path: '/notifications',
    name: 'notifications',
    icon: 'bell',
    access: 'canView',
    component: './Notifications',
  },
  {
    path: '/kb',
    name: 'kb',
    icon: 'book',
    access: 'canAdmin',
    component: './KnowledgeBase',
  },
  {
    path: '/copilot-history',
    name: 'copilotHistory',
    icon: 'message',
    access: 'canAdmin',
    component: './CopilotHistory',
  },
  // ==================== Localization & Regional Settings ====================
  {
    path: '/currencies',
    name: 'currencies',
    icon: 'dollar',
    access: 'canAdmin',
    component: './Currencies',
  },
  {
    path: '/translations',
    name: 'translations',
    icon: 'global',
    access: 'canAdmin',
    component: './Translations',
  },
  {
    path: '/tax',
    name: 'tax',
    icon: 'calculator',
    access: 'canAdmin',
    component: './Tax',
  },
  {
    path: '/carriers',
    name: 'carriers',
    icon: 'truck',
    access: 'canAdmin',
    component: './Carriers',
  },
  // ==================== Test Results ====================
  {
    path: '/test-results',
    name: 'testResults',
    icon: 'experiment',
    access: 'canAdmin',
    component: './TestResults',
  },
  // ==================== Default redirect & fallback ====================
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/*',
    hideInMenu: true,
    redirect: '/dashboard',
  },
];
