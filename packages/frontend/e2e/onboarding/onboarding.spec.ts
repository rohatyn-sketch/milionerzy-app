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
    await expect(page.locator('.tour-counter')).toHaveText('1 / 6');
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

  test('completing the menu tour leaves the player on the menu; pressing Play starts the in-game tour', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.tour-overlay')).toBeVisible();

    // Advance through the 6 menu steps; the last one points at Play.
    const next = page.locator('.tour-next');
    for (let step = 1; step <= 5; step++) {
      await expect(page.locator('.tour-counter')).toHaveText(`${step} / 6`);
      await next.click();
    }
    await expect(page.locator('.tour-counter')).toHaveText('6 / 6');
    await expect(next).toHaveText('Rozumiem');
    await next.click();

    // No automatic jump into the game: the tour closes and Play is highlighted.
    await expect(page.locator('.tour-overlay')).toHaveCount(0);
    await expect(page).not.toHaveURL(/game\.html/);
    const play = page.locator('#play-controls a.btn-primary');
    await expect(play).toHaveClass(/play-hint/);

    await Promise.all([page.waitForURL('**/game.html'), play.click()]);

    // The in-game tour continues automatically on the game screen.
    await expect(page.locator('.tour-overlay')).toBeVisible();
    await expect(page.locator('.tour-title')).toContainText('Pytanie');

    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_onboarding'));
    expect(stored).toBe('active');
  });
});
