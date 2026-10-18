import { expect, test } from '../fixtures';

test.describe('Main menu loads', () => {
  test('renders title, primary navigation, play button and money display', async ({ page }) => {
    await test.step('navigate to home page', async () => {
      await page.goto('/');
      await expect(page).toHaveTitle(/EduFiszka/);
    });

    await test.step('title is visible', async () => {
      await expect(page.locator('h1.title')).toHaveText('EduFiszka');
    });

    await test.step('play button links to game', async () => {
      const playBtn = page.locator('a.btn-primary', { hasText: 'Graj' });
      await expect(playBtn).toBeVisible();
      await expect(playBtn).toHaveAttribute('href', 'game.html');
    });

    await test.step('primary navigation links to all top-level pages', async () => {
      const nav = page.getByRole('navigation', { name: 'Nawigacja glowna' });
      await expect(nav.getByRole('link', { name: 'Start', exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(nav.getByRole('link', { name: 'Postepy', exact: true })).toHaveAttribute('href', 'achievements.html');
      await expect(nav.getByRole('link', { name: 'Sklep', exact: true })).toHaveAttribute('href', 'shop.html');
    });

    await test.step('wallet chip in the app bar shows the balance', async () => {
      await expect(page.locator('#wallet-amount')).toHaveText(/PLN/);
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
