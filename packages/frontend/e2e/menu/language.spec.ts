import { expect, test } from '../fixtures';

test.describe('Language switcher', () => {
  test('defaults to Polish and the toggle shows PL', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#lang-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveText('PL');
    // Polish UI text is present by default.
    await expect(page.locator('a.btn-primary', { hasText: 'Graj' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  });

  test('switching to English translates the UI and persists', async ({ page }) => {
    await page.goto('/');
    await page.locator('#lang-toggle').click();

    // The click reloads the page in English.
    await expect(page.locator('#lang-toggle')).toHaveText('EN');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_lang'));
    expect(stored).toBe('en');

    // Menu chrome is translated.
    await expect(page.locator('a.btn-primary', { hasText: 'Play' })).toBeVisible();
    await expect(page.locator('a.btn-secondary', { hasText: 'Shop' })).toBeVisible();
    await expect(page.locator('#subtitle-text')).toHaveText('Pick a class and play!');
  });

  test('language carries across pages', async ({ page }) => {
    await page.goto('/');
    await page.locator('#lang-toggle').click();
    await expect(page.locator('#lang-toggle')).toHaveText('EN');

    await page.goto('/shop.html');
    await expect(page.locator('.shop-title')).toHaveText('Shop');
    await expect(page.locator('.shop-section-title').first()).toHaveText('Visual themes');

    await page.goto('/game.html');
    // Lifeline label and keyboard hint are translated on the game screen.
    await expect(page.locator('#lifeline-skip')).toContainText('Skip');
    await expect(page.locator('.keyboard-hints')).toContainText('exit');
  });
});
