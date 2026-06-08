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
    await expect(hexInput).toBeVisible();

    // Record original color
    const originalColor = await hexInput.inputValue();

    // Change to red
    await hexInput.fill('#FF0000');
    await expect(swatch).toHaveCSS('background-color', 'rgb(255, 0, 0)');

    // Wait for undo button to become enabled, then click
    const undoButton = page.locator('button[aria-label="Undo"]');
    await expect(undoButton).toBeEnabled();
    await undoButton.click();

    // Picker is still open — verify hex input reverted
    await expect(hexInput).toHaveValue(originalColor);
  });

  test('redo restores undone change', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await expect(hexInput).toBeVisible();

    await hexInput.fill('#00FF00');
    await expect(swatch).toHaveCSS('background-color', 'rgb(0, 255, 0)');

    // Undo
    const undoButton = page.locator('button[aria-label="Undo"]');
    await expect(undoButton).toBeEnabled();
    await undoButton.click();

    await expect(swatch).not.toHaveCSS('background-color', 'rgb(0, 255, 0)');

    // Redo
    const redoButton = page.locator('button[aria-label="Redo"]');
    await expect(redoButton).toBeEnabled();
    await redoButton.click();

    await expect(swatch).toHaveCSS('background-color', 'rgb(0, 255, 0)');
  });

  test('keyboard shortcut Ctrl+Z triggers undo', async ({ page }) => {
    const swatch = page.locator('[data-testid="swatch---color-primary"]');
    await swatch.click();

    const hexInput = page.locator('[data-testid="hex-input---color-primary"]');
    await expect(hexInput).toBeVisible();

    const originalColor = await hexInput.inputValue();

    await hexInput.fill('#0000FF');
    await expect(swatch).toHaveCSS('background-color', 'rgb(0, 0, 255)');

    // Use keyboard shortcut
    await page.keyboard.press('Control+z');

    // Verify color reverted
    await expect(hexInput).toHaveValue(originalColor);
  });
});
