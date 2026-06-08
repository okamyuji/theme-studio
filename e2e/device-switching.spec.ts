import { test, expect } from '@playwright/test';

test.describe('Device Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('defaults to iPhone 15 Pro', async ({ page }) => {
    const frame = page.locator('[data-testid="device-frame"]');
    await expect(frame).toHaveAttribute('data-device', 'iphone15pro');
  });

  test('switches to Pixel 8', async ({ page }) => {
    const select = page.locator('[aria-label="Device selector"]');
    await select.selectOption('pixel8');

    const frame = page.locator('[data-testid="device-frame"]');
    await expect(frame).toHaveAttribute('data-device', 'pixel8');
  });

  test('switches to iPad Air', async ({ page }) => {
    const select = page.locator('[aria-label="Device selector"]');
    await select.selectOption('ipadAir');

    const frame = page.locator('[data-testid="device-frame"]');
    await expect(frame).toHaveAttribute('data-device', 'ipadAir');
  });

  test('switches to Desktop', async ({ page }) => {
    const select = page.locator('[aria-label="Device selector"]');
    await select.selectOption('desktop');

    const frame = page.locator('[data-testid="device-frame"]');
    await expect(frame).toHaveAttribute('data-device', 'desktop');
  });
});
