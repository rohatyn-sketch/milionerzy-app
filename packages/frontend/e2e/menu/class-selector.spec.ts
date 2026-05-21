import { expect, test } from '@playwright/test';

test.describe('Class selector', () => {
  test('default class card is rendered', async ({ page }) => {
    await page.goto('/');

    await test.step('class selector container exists', async () => {
      await expect(page.locator('#class-selector')).toBeVisible();
    });

    await test.step('at least one class card is present', async () => {
      // The default "Fizyka" class should always be rendered
      const cards = page.locator('.class-card');
      await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    });
  });

  test('setup panel opens and closes', async ({ page }) => {
    await page.goto('/');

    await test.step('click gear icon to open setup panel', async () => {
      await page.locator('#setup-toggle').click();
      await expect(page.locator('#setup-panel')).toBeVisible();
    });

    await test.step('panel has class name input', async () => {
      await expect(page.locator('#class-name-input')).toBeVisible();
    });

    await test.step('close panel', async () => {
      await page.locator('#setup-panel-close').click();
      await expect(page.locator('#setup-panel')).not.toBeVisible();
    });
  });
});
