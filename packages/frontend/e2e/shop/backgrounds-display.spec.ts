import { expect, test } from '@playwright/test';

test.describe('Shop backgrounds display', () => {
  test('all background items have name, description, and price — no empty cards', async ({ page }) => {
    await page.goto('/shop.html');

    const bgContainer = page.locator('#backgrounds-container');
    await expect(bgContainer).toBeVisible();

    await test.step('background items are rendered', async () => {
      const items = bgContainer.locator('.shop-item');
      const count = await items.count();
      // Default + 6 gradient backgrounds = 7
      expect(count).toBeGreaterThanOrEqual(7);
    });

    await test.step('every background card has a non-empty name', async () => {
      const names = bgContainer.locator('.shop-item-name');
      const count = await names.count();
      for (let i = 0; i < count; i++) {
        const text = await names.nth(i).textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
        // Should NOT be generic "Gradient 1" etc.
        expect(text).not.toMatch(/^Gradient \d+$/);
      }
    });

    await test.step('every background card has a description (not "undefined")', async () => {
      const descs = bgContainer.locator('.shop-item-desc');
      const count = await descs.count();
      for (let i = 0; i < count; i++) {
        const text = await descs.nth(i).textContent();
        expect(text).not.toBe('undefined');
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    await test.step('every background card has a price or "Darmowe"', async () => {
      const prices = bgContainer.locator('.shop-item-price');
      const count = await prices.count();
      for (let i = 0; i < count; i++) {
        const text = await prices.nth(i).textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
        expect(text).not.toBe('undefined');
      }
    });
  });
});
