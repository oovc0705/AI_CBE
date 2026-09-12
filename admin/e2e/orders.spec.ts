import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForTableLoad } from './helpers';

test.describe('订单页面 - 冒烟测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('应打开订单列表并显示履约列', async ({ page }) => {
    await page.goto('/orders');
    await waitForTableLoad(page);

    await expect(page.getByText('订单列表')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();
    await expect(page.getByText('履约')).toBeVisible();
  });

  test('应进入订单详情页并显示进度条', async ({ page }) => {
    await page.goto('/orders');
    await waitForTableLoad(page);

    const orderLink = page.locator('.ant-pro-table a').first();
    if (await orderLink.isVisible()) {
      await orderLink.click();

      await page.waitForURL(/\/orders\/\d+/, { timeout: 10_000 });

      await expect(page.getByText('订单信息')).toBeVisible();
      await expect(page.getByText('订单进度')).toBeVisible();
      await expect(page.locator('.ant-steps')).toBeVisible();
    }
  });
});
