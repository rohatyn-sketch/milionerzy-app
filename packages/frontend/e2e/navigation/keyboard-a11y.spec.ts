import { expect, test } from '../fixtures';

test.describe('Keyboard accessibility', () => {
  test('class cards are buttons that report the selected subject', async ({ page }) => {
    await page.goto('/');
    const select = page.locator('.class-card .class-card-select').first();
    await expect(select).toHaveAttribute('aria-pressed', 'true');
    await select.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.class-card .class-card-select').first()).toBeFocused();
  });

  test('formulas dialog takes focus, traps Tab and closes on Escape', async ({ page }) => {
    await page.goto('/');
    const opener = page.locator('#formulas-btn');
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Wzory i oznaczenia' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#formulas-close')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('#formulas-close')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator('#formulas-modal')).not.toHaveClass(/active/);
    await expect(opener).toBeFocused();
  });

  test('explanation dialog moves focus to "next" and Enter activates it', async ({ page }) => {
    await page.goto('/game.html');
    await expect(page.locator('.answer-btn').first()).toBeVisible();
    await page.keyboard.press('A');
    await expect(page.locator('#explanation-overlay')).toHaveClass(/active/, { timeout: 10_000 });
    await expect(page.locator('#next-btn')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#question-number')).toContainText('2');
  });
});
