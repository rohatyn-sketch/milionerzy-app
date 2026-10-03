// Imports the raw Playwright `test` (not the shared fixture) so onboarding is
// NOT pre-seeded — these specs exercise the first-time guide on a genuinely
// fresh visit.
import { expect, test } from '@playwright/test';

test.describe('First-time player onboarding', () => {
  test('menu tour appears for a brand-new visitor', async ({ page }) => {
    await page.goto('/');

    const overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();
    await expect(page.locator('.tour-title')).toContainText('Witaj');
    await expect(page.locator('.tour-counter')).toHaveText('1 / 7');
  });

  test('skipping the tour marks it done and it does not reappear', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.tour-overlay')).toBeVisible();

    await page.locator('.tour-skip').click();
    await expect(page.locator('.tour-overlay')).toHaveCount(0);

    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_onboarding'));
    expect(stored).toBe('done');

    // Reload: the tour must not come back.
    await page.reload();
    await expect(page.locator('.tour-overlay')).toHaveCount(0);
  });

  test('returning players (games already played) never see the tour', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('milionerzy_games_played', '3');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/');

    // Give the menu a moment; the tour, if it were going to open, opens on load.
    await expect(page.locator('h1.title')).toBeVisible();
    await expect(page.locator('.tour-overlay')).toHaveCount(0);
    // The null-state migration should have stamped the flag as done.
    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_onboarding'));
    expect(stored).toBe('done');
  });

  test('completing the menu tour leads into the in-game tour', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.tour-overlay')).toBeVisible();

    // Advance through the 7 menu steps; the final button navigates to the game.
    const next = page.locator('.tour-next');
    for (let step = 1; step <= 6; step++) {
      await expect(page.locator('.tour-counter')).toHaveText(`${step} / 7`);
      await next.click();
    }
    await expect(page.locator('.tour-counter')).toHaveText('7 / 7');
    await expect(next).toHaveText('Graj teraz');

    await Promise.all([page.waitForURL('**/game.html'), next.click()]);

    // The in-game tour continues automatically on the game screen.
    await expect(page.locator('.tour-overlay')).toBeVisible();
    await expect(page.locator('.tour-title')).toContainText('Pytanie');

    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_onboarding'));
    expect(stored).toBe('active');
  });
});
