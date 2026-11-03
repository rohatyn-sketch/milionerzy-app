import { expect, test } from '../fixtures';

// Regression: the game page used to call initSound('game') twice (the page
// entry and initGame), creating two background-music <audio> elements. When
// autoplay was allowed, both played, but pause/duck only reached the current
// reference — so the orphaned one kept playing over a podcast. Exactly one
// game-music track must ever exist.
test.describe('Game audio', () => {
  test('initialises a single background-music track (no orphan)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__gameTracks = 0;
      const OrigAudio = window.Audio;
      // Count how many game-music elements get constructed.
      (window as any).Audio = function (src?: string) {
        if (src && src.includes('game.m4a')) (window as any).__gameTracks++;
        return new OrigAudio(src);
      };
    });
    await page.goto('/game.html');
    await page.locator('.answer-btn').first().waitFor();
    const tracks = await page.evaluate(() => (window as any).__gameTracks);
    expect(tracks).toBe(1);
  });
});
