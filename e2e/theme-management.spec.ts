import { test, expect } from '@playwright/test';

test.describe('Theme Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
  });

  test('opens themes dialog', async ({ page }) => {
    const themesBtn = page.locator('[data-testid="themes-button"]');
    await expect(themesBtn).toBeVisible();
    await themesBtn.click();

    await expect(
      page.locator('[data-testid="theme-list-dialog"]'),
    ).toBeVisible();
  });

  test('creates a theme copy and shows it in the list', async ({ page }) => {
    // First save the current theme
    const saveBtn = page.locator('[aria-label="Save theme"]');
    await saveBtn.click();

    // Open themes dialog
    const themesBtn = page.locator('[data-testid="themes-button"]');
    await themesBtn.click();

    // Create a copy
    const createBtn = page.locator('[data-testid="create-theme-button"]');
    await createBtn.click();

    // Should see the copy in the list
    await expect(page.locator('text=(copy)')).toBeVisible();
  });

  test('opens export dialog and shows CSS output', async ({ page }) => {
    const exportBtn = page.locator('[data-testid="export-button"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();

    const preview = page.locator('[data-testid="export-preview"]');
    const value = await preview.inputValue();
    expect(value).toContain(':root {');
    expect(value).toContain('--color-primary');
  });

  test('switches export format tabs', async ({ page }) => {
    // Open export dialog
    const exportBtn = page.locator('[data-testid="export-button"]');
    await exportBtn.click();

    // Switch to JSON
    const jsonTab = page.locator('[data-testid="export-tab-json"]');
    await jsonTab.click();

    const preview = page.locator('[data-testid="export-preview"]');
    const jsonValue = await preview.inputValue();
    expect(jsonValue).toContain('"colors"');

    // Switch to Tailwind
    const tailwindTab = page.locator('[data-testid="export-tab-tailwind"]');
    await tailwindTab.click();

    const twValue = await preview.inputValue();
    expect(twValue).toContain('module.exports');
  });
});
