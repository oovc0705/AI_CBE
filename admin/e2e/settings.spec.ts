import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('设置页面 - 冒烟测试', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('应打开设置页并显示店铺信息表单', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('店铺信息')).toBeVisible();
    await expect(page.getByText('店铺名称')).toBeVisible();
    await expect(page.getByText('联系邮箱')).toBeVisible();

    await expect(page.getByText('支付网关')).toBeVisible();
    await expect(page.getByText('安全提示')).toBeVisible();
  });
});
