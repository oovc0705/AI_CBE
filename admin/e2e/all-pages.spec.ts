import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForTableLoad } from './helpers';

test.describe('Admin 全功能页面测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ==================== 核心业务页面 ====================

  test('Dashboard - 仪表盘', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.ant-pro-layout')).toBeVisible();
    await expect(page.locator('.ant-card')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/dashboard.png', fullPage: true });
  });

  test('Products - 商品管理', async ({ page }) => {
    await page.goto('/products');
    await waitForTableLoad(page);

    await expect(page.getByText('商品列表')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    // 测试搜索
    const searchInput = page.locator('input[placeholder*="搜索"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      await waitForTableLoad(page);
    }

    await page.screenshot({ path: 'e2e/screenshots/products.png', fullPage: true });
  });

  test('Orders - 订单管理', async ({ page }) => {
    await page.goto('/orders');
    await waitForTableLoad(page);

    await expect(page.getByText('订单列表')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    // 测试状态筛选
    const statusFilter = page.locator('.ant-select').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/screenshots/orders.png', fullPage: true });
  });

  test('Support - 客户支持', async ({ page }) => {
    await page.goto('/support');
    await waitForTableLoad(page);

    await expect(page.locator('.ant-pro-table')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/support.png', fullPage: true });
  });

  // ==================== 设置与管理页面 ====================

  test('Settings - 系统设置', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('系统设置')).toBeVisible();
    await expect(page.locator('.ant-form')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/settings.png', fullPage: true });
  });

  test('Categories - 品类管理', async ({ page }) => {
    await page.goto('/categories');
    await waitForTableLoad(page);

    await expect(page.getByText('品类')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/categories.png', fullPage: true });
  });

  test('Brands - 品牌管理', async ({ page }) => {
    await page.goto('/brands');
    await waitForTableLoad(page);

    await expect(page.getByText('品牌')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/brands.png', fullPage: true });
  });

  test('Coupons - 优惠券', async ({ page }) => {
    await page.goto('/coupons');
    await waitForTableLoad(page);

    await expect(page.getByText('优惠券')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/coupons.png', fullPage: true });
  });

  test('Users - 用户管理', async ({ page }) => {
    await page.goto('/users');
    await waitForTableLoad(page);

    await expect(page.getByText('用户')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/users.png', fullPage: true });
  });

  test('Subscribers - 邮件订阅', async ({ page }) => {
    await page.goto('/subscribers');
    await waitForTableLoad(page);

    await expect(page.getByText('订阅')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/subscribers.png', fullPage: true });
  });

  // ==================== 物流与支付 ====================

  test('Shipping - 物流设置', async ({ page }) => {
    await page.goto('/shipping');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('物流')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/shipping.png', fullPage: true });
  });

  test('Payment - 支付设置', async ({ page }) => {
    await page.goto('/payment');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('支付')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/payment.png', fullPage: true });
  });

  test('Carriers - 物流商', async ({ page }) => {
    await page.goto('/carriers');
    await waitForTableLoad(page);

    await expect(page.locator('.ant-pro-table')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/carriers.png', fullPage: true });
  });

  // ==================== 评价与营销 ====================

  test('Reviews - 评价管理', async ({ page }) => {
    await page.goto('/reviews');
    await waitForTableLoad(page);

    await expect(page.getByText('评价')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/reviews.png', fullPage: true });
  });

  test('Marketing - 营销活动', async ({ page }) => {
    await page.goto('/marketing');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('营销')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/marketing.png', fullPage: true });
  });

  // ==================== 数据与导出 ====================

  test('Export - 数据导出', async ({ page }) => {
    await page.goto('/export');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('导出')).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/export.png', fullPage: true });
  });

  // ==================== 权限与审计 ====================

  test('RBAC - 角色权限', async ({ page }) => {
    await page.goto('/rbac');
    await waitForTableLoad(page);

    await expect(page.getByText('角色')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/rbac.png', fullPage: true });
  });

  test('Audit - 审计日志', async ({ page }) => {
    await page.goto('/audit');
    await waitForTableLoad(page);

    await expect(page.getByText('审计')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/audit.png', fullPage: true });
  });

  // ==================== 通知与知识库 ====================

  test('Notifications - 通知管理', async ({ page }) => {
    await page.goto('/notifications');
    await waitForTableLoad(page);

    await expect(page.getByText('通知')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/notifications.png', fullPage: true });
  });

  test('Knowledge Base - 知识库', async ({ page }) => {
    await page.goto('/kb');
    await waitForTableLoad(page);

    await expect(page.getByText('知识库')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/kb.png', fullPage: true });
  });

  test('Copilot History - Copilot 历史', async ({ page }) => {
    await page.goto('/copilot-history');
    await waitForTableLoad(page);

    await expect(page.getByText('Copilot')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/copilot-history.png', fullPage: true });
  });

  // ==================== 本地化与区域设置 ====================

  test('Currencies - 货币管理', async ({ page }) => {
    await page.goto('/currencies');
    await waitForTableLoad(page);

    await expect(page.getByText('货币')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/currencies.png', fullPage: true });
  });

  test('Translations - 翻译管理', async ({ page }) => {
    await page.goto('/translations');
    await waitForTableLoad(page);

    await expect(page.getByText('翻译')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/translations.png', fullPage: true });
  });

  test('Tax - 税率管理', async ({ page }) => {
    await page.goto('/tax');
    await waitForTableLoad(page);

    await expect(page.getByText('税')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/tax.png', fullPage: true });
  });
});
