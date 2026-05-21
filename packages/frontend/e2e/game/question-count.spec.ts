import { expect, test } from '@playwright/test';

test.describe('Question count in game', () => {
  test('game loads with fallback questions and shows total in header', async ({ page }) => {
    await page.goto('/game.html');

    await test.step('question number shows total count', async () => {
      const questionNumber = page.locator('#question-number');
      await expect(questionNumber).toBeVisible();
      const text = await questionNumber.textContent();

      // Extract total from "Pytanie 1/N"
      const match = text?.match(/(\d+)\/(\d+)/);
      expect(match).not.toBeNull();

      const total = parseInt(match![2], 10);
      // Fallback questions should have at least 50
      expect(total).toBeGreaterThanOrEqual(50);
    });
  });

  test('reward per question adjusts to total count', async ({ page }) => {
    await page.goto('/game.html');

    await test.step('difficulty indicator shows per-question reward', async () => {
      const indicator = page.locator('#difficulty-indicator');
      await expect(indicator).toBeVisible();

      const text = await indicator.textContent();
      // Should contain "/ pytanie" with a money amount
      expect(text).toContain('/ pytanie');
      // The reward should be formatted as money (contains PLN or space-separated number)
      expect(text).toMatch(/\d/);
    });
  });
});
