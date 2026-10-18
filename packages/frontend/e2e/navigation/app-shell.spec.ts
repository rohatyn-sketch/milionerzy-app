import { expect, test } from '../fixtures';

test.describe('App shell navigation', () => {
  test('progress page is reachable from the main navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Postepy', exact: true }).click();
    await page.waitForURL('**/achievements.html');

    await expect(page.locator('h1')).toHaveText('Postepy');
    await expect(page.getByRole('link', { name: 'Postepy', exact: true })).toHaveAttribute('aria-current', 'page');
    // Achievements, stats and the full leaderboard all live here now.
    await expect(page.locator('.achievement-card').first()).toBeVisible();
    await expect(page.locator('#games-played')).toBeVisible();
    await expect(page.locator('#leaderboard-full')).toContainText(/Brak wynikow|PLN/);
  });

  test('every top-level page shares the same navigation', async ({ page }) => {
    for (const path of ['/', '/shop.html', '/achievements.html']) {
      await page.goto(path);
      const nav = page.getByRole('navigation', { name: 'Nawigacja glowna' });
      await expect(nav.getByRole('link')).toHaveCount(3);
    }
  });

  test('wallet chip follows balance changes', async ({ page }) => {
    await page.goto('/');
    await page.locator('#code-input').fill('wrong');
    await page.locator('#code-btn').click();
    await expect(page.locator('#code-message')).toHaveClass(/error/);
    await expect(page.locator('#wallet-amount')).toHaveText('0 PLN');
  });

  test('phones get a bottom tab bar that does not cover the header controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const nav = page.locator('.app-nav');
    const box = await nav.boundingBox();
    expect(box).not.toBeNull();
    // Pinned to the bottom of the viewport.
    expect(Math.round(box!.y + box!.height)).toBe(812);

    // Language switcher and sign-in no longer overlap (they used to on phones).
    const lang = await page.locator('#lang-switcher').boundingBox();
    const auth = await page.locator('#auth-area').boundingBox();
    expect(lang && auth).toBeTruthy();
    expect(lang!.x + lang!.width).toBeLessThanOrEqual(auth!.x + 1);

    // No horizontal scrolling at 375px.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('game screen is a focused mode without the tab bar', async ({ page }) => {
    await page.goto('/game.html');
    await expect(page.locator('.app-nav')).toHaveCount(0);
    await expect(page.locator('#back-to-menu')).toBeVisible();
  });
});
