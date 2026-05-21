import { expect, test } from '@playwright/test';

test.describe('Game page loads', () => {
  test('game surface mounts with question, answers, timer, and lifelines', async ({ page }) => {
    await test.step('navigate to game page', async () => {
      await page.goto('/game.html');
    });

    await test.step('question text is visible', async () => {
      await expect(page.locator('#question-text')).toBeVisible();
      // Should not still say "loading"
      await expect(page.locator('#question-text')).not.toHaveText('Ladowanie pytania...', { timeout: 10_000 });
    });

    await test.step('question number shows progress', async () => {
      await expect(page.locator('#question-number')).toContainText(/Pytanie \d+\/\d+/);
    });

    await test.step('four answer buttons are visible', async () => {
      const btns = page.locator('.answer-btn');
      await expect(btns).toHaveCount(4);
      await expect(btns.first()).toBeVisible();
    });

    await test.step('timer is running', async () => {
      const timerText = page.locator('#timer-text');
      await expect(timerText).toBeVisible();
      await expect(timerText).toContainText(/\d+s/);
    });

    await test.step('lifeline buttons are present', async () => {
      await expect(page.locator('#lifeline-fifty')).toBeVisible();
      await expect(page.locator('#lifeline-skip')).toBeVisible();
      await expect(page.locator('#lifeline-time')).toBeVisible();
    });

    await test.step('difficulty indicator is shown', async () => {
      await expect(page.locator('#difficulty-indicator')).toBeVisible();
    });

    await test.step('back to menu link exists', async () => {
      await expect(page.locator('#back-to-menu')).toBeVisible();
    });
  });

  test('answering a question shows explanation overlay', async ({ page }) => {
    await page.goto('/game.html');

    // Wait for question to load
    await expect(page.locator('#question-text')).not.toHaveText('Ladowanie pytania...', { timeout: 10_000 });

    await test.step('click first answer', async () => {
      await page.locator('.answer-btn').first().click();
    });

    await test.step('explanation overlay appears after delay', async () => {
      await expect(page.locator('#explanation-overlay.active')).toBeVisible({ timeout: 5_000 });
    });

    await test.step('explanation has result text', async () => {
      const result = page.locator('#explanation-result');
      await expect(result).toBeVisible();
      // Should say either correct or incorrect
      await expect(result).toContainText(/odpowiedz/i);
    });

    await test.step('next button is visible', async () => {
      await expect(page.locator('#next-btn')).toBeVisible();
    });

    await test.step('clicking next advances to next question', async () => {
      await page.locator('#next-btn').click();
      await expect(page.locator('#explanation-overlay')).not.toHaveClass(/active/);
      await expect(page.locator('#question-number')).toContainText(/Pytanie 2\//);
    });
  });
});
