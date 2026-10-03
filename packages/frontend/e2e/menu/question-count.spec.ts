import { expect, test } from '../fixtures';

test.describe('Question count slider', () => {
  test('slider is visible and reflects the available range', async ({ page }) => {
    await page.goto('/');

    const slider = page.locator('#question-count-slider');
    await expect(slider).toBeVisible();
    // Default class ships a sizeable fallback set, so the max is well above the min.
    const max = Number(await slider.getAttribute('max'));
    const min = Number(await slider.getAttribute('min'));
    expect(min).toBe(5);
    expect(max).toBeGreaterThan(min);
  });

  test('choosing a count persists and the game plays that many questions', async ({ page }) => {
    await page.goto('/');

    const slider = page.locator('#question-count-slider');
    await expect(slider).toBeVisible();

    // Set the slider to 7 and fire the input handler.
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = '7';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await expect(page.locator('#question-count-value')).toHaveText('7');
    const stored = await page.evaluate(() => localStorage.getItem('milionerzy_question_count'));
    expect(stored).toBe('7');

    // Start a game and confirm the round has exactly 7 questions.
    await page.locator('.menu-buttons a.btn-primary', { hasText: 'Graj' }).click();
    await page.waitForURL('**/game.html');
    await expect(page.locator('#question-number')).toContainText('/7');
  });
});
