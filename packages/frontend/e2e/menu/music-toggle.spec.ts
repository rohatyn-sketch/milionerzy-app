import { expect, test } from '@playwright/test';

test.describe('Music toggle', () => {
  test('enabling music changes toggle state and persists preference', async ({ page }) => {
    await page.goto('/');

    const musicToggle = page.locator('#music-toggle');
    await expect(musicToggle).toBeVisible();
    await expect(musicToggle).toHaveText(/OFF/);

    await test.step('click to enable music', async () => {
      await musicToggle.click();
      await expect(musicToggle).toHaveText(/ON/);
    });

    await test.step('preference is saved to localStorage', async () => {
      const stored = await page.evaluate(() => localStorage.getItem('milionerzy_sound_music'));
      expect(stored).toBe('true');
    });

    await test.step('click to disable music', async () => {
      await musicToggle.click();
      await expect(musicToggle).toHaveText(/OFF/);
    });

    await test.step('preference is updated in localStorage', async () => {
      const stored = await page.evaluate(() => localStorage.getItem('milionerzy_sound_music'));
      expect(stored).toBe('false');
    });
  });

  test('music toggle reflects previously saved state on page load', async ({ page }) => {
    await page.goto('/');
    // Set localStorage to simulate previously enabled music
    await page.evaluate(() => {
      localStorage.setItem('milionerzy_sound_music', 'true');
    });

    // Reload to trigger initSound with music enabled
    await page.reload();

    await test.step('music toggle shows ON after reload', async () => {
      await expect(page.locator('#music-toggle')).toHaveText(/ON/);
    });

    await test.step('toggle class is active', async () => {
      await expect(page.locator('#music-toggle')).toHaveClass(/active/);
    });
  });

  test('music state persists across pages', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('milionerzy_sound_music', 'true');
    });
    await page.reload();
    await expect(page.locator('#music-toggle')).toHaveText(/ON/);

    // Navigate to game and back
    await page.goto('/game.html');
    await page.goto('/');

    await test.step('music toggle still shows ON', async () => {
      await expect(page.locator('#music-toggle')).toHaveText(/ON/);
    });
  });
});
