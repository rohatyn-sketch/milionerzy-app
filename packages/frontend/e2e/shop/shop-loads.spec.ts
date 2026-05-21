import { expect, test } from '@playwright/test';

test.describe('Shop page loads', () => {
  test('shop surface mounts with sections and money display', async ({ page }) => {
    await test.step('navigate to shop', async () => {
      await page.goto('/shop.html');
    });

    await test.step('shop title is visible', async () => {
      await expect(page.locator('h1.shop-title')).toHaveText('Sklep');
    });

    await test.step('money display is visible', async () => {
      await expect(page.locator('#money-amount')).toBeVisible();
    });

    await test.step('shop sections are present', async () => {
      await expect(page.locator('.shop-section')).toHaveCount(3);
    });

    await test.step('theme items are rendered', async () => {
      await expect(page.locator('#themes-container .shop-item').first()).toBeVisible({ timeout: 5_000 });
    });
  });
});
