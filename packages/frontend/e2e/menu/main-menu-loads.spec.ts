import { expect, test } from '@playwright/test';

test.describe('Main menu loads', () => {
  test('renders title, nav buttons, and money display', async ({ page }) => {
    await test.step('navigate to home page', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Milionerzy/);
    });

    await test.step('title is visible', async () => {
      await expect(page.locator('h1.title')).toHaveText('Milionerzy');
    });

    await test.step('play button links to game', async () => {
      const playBtn = page.locator('a.btn-primary', { hasText: 'Graj' });
      await expect(playBtn).toBeVisible();
      await expect(playBtn).toHaveAttribute('href', 'game.html');
    });

    await test.step('shop button is visible', async () => {
      await expect(page.locator('a.btn-secondary', { hasText: 'Sklep' })).toBeVisible();
    });

    await test.step('money display is visible', async () => {
      await expect(page.locator('#money-amount')).toBeVisible();
    });

    await test.step('daily challenge section is present', async () => {
      await expect(page.locator('#daily-section')).toBeVisible();
    });

    await test.step('leaderboard section is present', async () => {
      await expect(page.locator('.leaderboard-section')).toBeVisible();
    });
  });

  test('sound toggles are interactive', async ({ page }) => {
    await page.goto('/');

    const sfxToggle = page.locator('#sfx-toggle');
    await expect(sfxToggle).toBeVisible();
    await sfxToggle.click();
    await expect(sfxToggle).toHaveText(/OFF/);
    await sfxToggle.click();
    await expect(sfxToggle).toHaveText(/ON/);
  });
});
