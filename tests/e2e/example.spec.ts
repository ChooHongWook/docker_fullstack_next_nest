import { test, expect } from '@playwright/test';

test.describe('Frontend Application', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Next\.js/i);
  });

  test('should have heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('API Health Check', () => {
  test('should return health status', async ({ request }) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await request.get(`${baseURL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});
