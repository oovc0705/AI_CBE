import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForTableLoad } from './helpers';

test.describe('商品页面 - 冒烟测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('应打开商品列表页', async ({ page }) => {
    await page.goto('/products');
    await waitForTableLoad(page);

    await expect(page.getByText('商品列表')).toBeVisible();
    await expect(page.locator('.ant-pro-table')).toBeVisible();
    await expect(page.getByRole('button', { name: /新建商品/ })).toBeVisible();
  });

  test('应打开创建抽屉并含多语言标签', async ({ page }) => {
    await page.goto('/products');
    await waitForTableLoad(page);

    await page.getByRole('button', { name: /新建商品/ }).click();
    await expect(page.locator('.ant-drawer')).toBeVisible();

    await expect(page.locator('#sku')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#price')).toBeVisible();
    await expect(page.locator('#stock')).toBeVisible();

    // Verify translation tabs exist
    await expect(page.getByRole('tab', { name: /English/ })).toBeVisible();

    // Verify variant section exists
    await expect(page.getByText('SKU 变体')).toBeVisible();
  });

  test('应有导出和导入按钮', async ({ page }) => {
    await page.goto('/products');
    await waitForTableLoad(page);

    await expect(page.getByRole('button', { name: /导出/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /导入/ })).toBeVisible();
  });
});
