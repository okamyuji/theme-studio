import { test, expect } from '@playwright/test';

test.describe('Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('undo restores previous color', async ({ page }) => {
    // Open primary color picker
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');

    // Change to red
    await hexInput.fill('#FF0000');
    await expect(swatch).toHaveCSS('background-color', 'rgb(255, 0, 0)');

    // Click undo
    const undoButton = page.locator('[aria-label="Undo"]');
    await undoButton.click();

    // Swatch should revert. Re-open picker to check input.
    await swatch.click();
    const restoredInput = page.locator(
      '[data-testid="hex-input---color-primary"]',
    );
    const value = await restoredInput.inputValue();
    expect(value.toLowerCase()).not.toBe('#ff0000');
  });

  test('redo restores undone change', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await hexInput.fill('#00FF00');

    // Undo
    const undoButton = page.locator('[aria-label="Undo"]');
    await undoButton.click();

    // Redo
    const redoButton = page.locator('[aria-label="Redo"]');
    await redoButton.click();

    // Re-open picker
    await swatch.click();
    const restoredInput = page.locator(
      '[data-testid="hex-input---color-primary"]',
    );
    const value = await restoredInput.inputValue();
    expect(value.toLowerCase()).toBe('#00ff00');
  });

  test('keyboard shortcut Ctrl+Z triggers undo', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await hexInput.fill('#0000FF');

    // Use keyboard shortcut
    await page.keyboard.press('Control+z');

    // Verify color reverted
    await swatch.click();
    const restoredInput = page.locator(
      '[data-testid="hex-input---color-primary"]',
    );
    const value = await restoredInput.inputValue();
    expect(value.toLowerCase()).not.toBe('#0000ff');
  });
});
