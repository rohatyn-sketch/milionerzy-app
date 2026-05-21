import { expect, test } from '@playwright/test';

test.describe('Keyboard shortcuts', () => {
  test('A/B/C/D keys select answers', async ({ page }) => {
    await page.goto('/game.html');
    await expect(page.locator('#question-text')).not.toHaveText('Ladowanie pytania...', { timeout: 10_000 });

    await test.step('press A to select first answer', async () => {
      await page.keyboard.press('a');
    });

    await test.step('explanation overlay appears', async () => {
      await expect(page.locator('#explanation-overlay.active')).toBeVisible({ timeout: 5_000 });
    });

    await test.step('press Space to go to next question', async () => {
      await page.keyboard.press('Space');
      await expect(page.locator('#explanation-overlay')).not.toHaveClass(/active/);
      await expect(page.locator('#question-number')).toContainText(/Pytanie 2\//);
    });
  });
});
