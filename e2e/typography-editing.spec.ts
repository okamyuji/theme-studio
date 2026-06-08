import { test, expect } from '@playwright/test';

test.describe('Typography Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens typography section and shows sliders', async ({ page }) => {
    // Click on Typography collapsible section header
    const typographyHeader = page.locator('[data-testid="section-Typography"]');
    await typographyHeader.locator('button').click();

    // Font size sliders should be visible
    const fontSizeSlider = page.locator(
      '[data-testid="slider---font-size-base"]',
    );
    await expect(fontSizeSlider).toBeVisible();
  });

  test('changes font size via slider', async ({ page }) => {
    // Open Typography section
    const typographyHeader = page.locator('[data-testid="section-Typography"]');
    await typographyHeader.locator('button').click();

    const slider = page.locator('[data-testid="slider---font-size-base"]');
    await expect(slider).toBeVisible();

    // Change the slider value
    await slider.fill('1.5');

    // Verify the value display updated
    await expect(page.locator('text=1.5rem')).toBeVisible();
  });

  test('changes font family via selector', async ({ page }) => {
    // Open Typography section
    const typographyHeader = page.locator('[data-testid="section-Typography"]');
    await typographyHeader.locator('button').click();

    const select = page.locator('[data-testid="font-family-select"]');
    await expect(select).toBeVisible();

    await select.selectOption('"Roboto", sans-serif');
  });

  test('line height sliders are available', async ({ page }) => {
    // Open Typography section
    const typographyHeader = page.locator('[data-testid="section-Typography"]');
    await typographyHeader.locator('button').click();

    const slider = page.locator('[data-testid="slider---line-height-normal"]');
    await expect(slider).toBeVisible();
  });
});
