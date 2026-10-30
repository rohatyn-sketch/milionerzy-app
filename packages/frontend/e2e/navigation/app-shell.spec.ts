import { expect, test } from '../fixtures';

test.describe('App navigation', () => {
  test('every top-level page shares the same navigation and wallet', async ({ page }) => {
    for (const [path, current] of [['/', 'Start'], ['/achievements.html', 'Postepy'], ['/shop.html', 'Sklep']]) {
      await page.goto(path);
      const nav = page.getByRole('navigation', { name: 'Nawigacja glowna' });
      await expect(nav.getByRole('link')).toHaveCount(3);
      await expect(nav.getByRole('link', { name: current, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('#wallet-amount')).toHaveText(/PLN/);
    }
  });

  test('Postepy page shows stats, achievements with text status and the full leaderboard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('milionerzy_achievements', JSON.stringify(['first_win']));
      localStorage.setItem('milionerzy_leaderboard', JSON.stringify([{ name: 'Gracz', score: 123456, date: new Date().toISOString() }]));
    });
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: 'Postepy', exact: true }).click();
    await page.waitForURL('**/achievements.html');
    await expect(page.locator('h1')).toHaveText('Postepy');
    await expect(page.locator('#games-played')).toBeVisible();
    await expect(page.locator('.achievement-card.unlocked .achievement-status').first()).toHaveText('Odblokowane');
    await expect(page.locator('.achievement-card.locked .achievement-status').first()).toHaveText('Zablokowane');
    await expect(page.locator('#leaderboard-full .leaderboard-entry')).toHaveCount(1);
    await expect(page.locator('#leaderboard-full')).toContainText('123,456 PLN');
  });

  test('the old achievements.html address still works', async ({ page }) => {
    const res = await page.goto('/achievements.html');
    expect(res?.status()).toBe(200);
    // Achievements now live behind a tab on the Postepy dashboard.
    await page.getByRole('tab', { name: 'Osiagniecia' }).click();
    await expect(page.locator('.achievements-grid .achievement-card').first()).toBeVisible();
  });

  test('Statistics tab shows accuracy, questions answered and personal records', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('milionerzy_questions_answered', '8');
      localStorage.setItem('milionerzy_correct_answers', '6');
      localStorage.setItem('milionerzy_best_streak', '4');
      localStorage.setItem('milionerzy_perfect_games', '2');
    });
    await page.goto('/achievements.html');
    await page.getByRole('tab', { name: 'Statystyki' }).click();
    await expect(page.locator('#panel-stats')).toBeVisible();
    await expect(page.locator('#stat-accuracy')).toHaveText('75%'); // 6 / 8
    await expect(page.locator('#stat-answered')).toHaveText('8');
    await expect(page.locator('#stat-correct')).toHaveText('6');
    await expect(page.locator('#rec-streak')).toHaveText('4');
    await expect(page.locator('#rec-perfect')).toHaveText('2');
    // The overview tab's panel is hidden while Statistics is active.
    await expect(page.locator('#panel-overview')).toBeHidden();
  });

  test('wallet follows balance changes (bonus code)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#wallet-amount')).toHaveText('0 PLN');
    await page.locator('#code-input').fill('Markot');
    await page.locator('#code-btn').click();
    await expect(page.locator('#code-message')).toHaveClass(/success/);
    await expect(page.locator('#wallet-amount')).toHaveText('1,000,000 PLN');
  });

  test('phones get a bottom tab bar pinned to the bottom, no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const path of ['/', '/achievements.html', '/shop.html']) {
      await page.goto(path);
      const box = (await page.locator('.app-nav').boundingBox())!;
      expect(Math.round(box.y + box.height)).toBe(667);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('first visit on a phone: a subject and the Play button are visible without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const navTop = (await page.locator('.app-nav').boundingBox())!.y;
    const subject = (await page.locator('.class-card-select').first().boundingBox())!;
    const play = (await page.getByRole('link', { name: 'Graj', exact: true }).boundingBox())!;
    expect(subject.y).toBeGreaterThanOrEqual(0);
    expect(subject.y + subject.height).toBeLessThanOrEqual(navTop);
    expect(play.y + play.height).toBeLessThanOrEqual(navTop);
    // Graj is the only filled primary button on the page.
    await expect(page.locator('main .btn-primary')).toHaveCount(1);
  });

  test('game is a focused mode: no navigation, one "Zakoncz gre" exit', async ({ page }) => {
    await page.goto('/game.html');
    await expect(page.locator('.app-nav')).toHaveCount(0);
    await expect(page.locator('#back-to-menu')).toHaveText(/Zakoncz gre/);
    await expect(page.locator('a:visible')).toHaveCount(1);
  });
});
