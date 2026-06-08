import { test, expect } from '@playwright/test';

test.describe('Color Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays color swatches', async ({ page }) => {
    const swatches = page.locator('[data-testid^="swatch-"]');
    await expect(swatches.first()).toBeVisible();
    const count = await swatches.count();
    expect(count).toBeGreaterThanOrEqual(12);
  });

  test('opens color picker when swatch is clicked', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await expect(hexInput).toBeVisible();
  });

  test('changes color via hex input', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await hexInput.fill('#FF0000');

    // Verify the swatch background updated
    await expect(swatch).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });
});
