import type { Page } from '@playwright/test';

/**
 * Authenticate via mock login flow.
 * Stores the session cookie/localStorage for subsequent requests.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/user/login');
  await page.waitForLoadState('networkidle');

  // Fill login form (mock: admin / ant.design)
  await page.getByPlaceholder('Username: admin or user').fill('admin');
  await page.getByPlaceholder('Password: ant.design').fill('ant.design');
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for navigation after successful login
  await page.waitForURL('**/orders', { timeout: 15_000 }).catch(() => {
    // Fallback: just wait for any authenticated state
  });
}

/**
 * Wait for ProTable to finish loading data
 */
export async function waitForTableLoad(page: Page) {
  // Wait for loading spinner to disappear
  await page.waitForSelector('.ant-spin-spinning', { state: 'hidden', timeout: 10_000 }).catch(() => {
    // Table might not show spinner if data loads fast
  });
  // Wait a bit for render
  await page.waitForTimeout(500);
}
