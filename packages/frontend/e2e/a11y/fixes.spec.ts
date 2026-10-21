import { expect, test } from '../fixtures';

// Regression tests for the UI / accessibility fixes: keyboard use, dialogs,
// phone layout, tap targets and text alternatives.

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe('Keyboard', () => {
  test('class cards are buttons that report the selected subject', async ({ page }) => {
    await page.goto('/');
    const select = page.locator('.class-card .class-card-select').first();
    await expect(select).toHaveAttribute('aria-pressed', 'true');
    await select.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.class-card .class-card-select').first()).toBeFocused();
    await expect(page.locator('.class-card-add')).toHaveJSProperty('tagName', 'BUTTON');
  });

  test('explanation moves focus to "Next" and Enter activates it', async ({ page }) => {
    await page.goto('/game.html');
    await expect(page.locator('.answer-btn').first()).toBeVisible();
    await page.keyboard.press('A');
    await expect(page.locator('#explanation-overlay')).toHaveClass(/active/, { timeout: 10_000 });
    await expect(page.locator('#next-btn')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#question-number')).toContainText('2');
  });

  test('a whole game can be played with the keyboard, ending on "Play again"', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('milionerzy_question_count', '5'));
    await page.goto('/game.html');
    await expect(page.locator('.answer-btn').first()).toBeVisible();
    for (let q = 1; q <= 5; q++) {
      await expect(page.locator('#question-number')).toContainText(`${q}/5`);
      await page.keyboard.press('1');
      await expect(page.locator('#next-btn')).toBeFocused({ timeout: 10_000 });
      await page.keyboard.press('Enter');
    }
    await expect(page.locator('#end-screen')).toHaveClass(/active/);
    const playAgain = page.locator('#end-screen .end-buttons a').first();
    await expect(playAgain).toBeFocused();
    await Promise.all([page.waitForURL('**/game.html'), page.keyboard.press('Enter')]);
  });
});

test.describe('Dialogs', () => {
  test('formulas dialog: named, takes focus, traps Tab, closes on Esc', async ({ page }) => {
    await page.goto('/');
    const opener = page.locator('#formulas-btn');
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Wzory i oznaczenia' })).toBeVisible();
    await expect(page.locator('#formulas-close')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#formulas-close')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#formulas-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#formulas-modal')).not.toHaveClass(/active/);
    await expect(opener).toBeFocused();
  });

  test('"Dodaj klase" is the single labelled entry; signed out it shows an inline sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.setup-toggle, button[title*="AI"]')).toHaveCount(0);
    const add = page.getByRole('button', { name: /Dodaj klase/ });
    await expect(add).toHaveCount(1);
    await add.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Dodaj nowa klase' })).toBeVisible();
    await expect(page.locator('#setup-signin-btn')).toBeFocused();
    await expect(page.locator('#auth-notice')).toBeVisible();
    await expect(page.locator('#generate-btn')).toBeDisabled();
    await expect(page.locator('#login-prompt-overlay')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#setup-panel')).not.toHaveClass(/active/);
    await expect(add).toBeFocused();
  });
});

test.describe('Phone layout (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('home: wallet, language, sign-in and title do not overlap; no sideways scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#google-signin-btn')).toBeVisible();
    const wallet = (await page.locator('#wallet-chip').boundingBox())!;
    const lang = (await page.locator('#lang-switcher').boundingBox())!;
    const signin = (await page.locator('#google-signin-btn').boundingBox())!;
    const title = (await page.locator('h1.title').boundingBox())!;
    expect(overlaps(wallet, lang)).toBe(false);
    expect(overlaps(lang, signin)).toBe(false);
    expect(overlaps(signin, title)).toBe(false);
    expect(signin.x + signin.width).toBeLessThanOrEqual(375);
    // Language and sign-in sit in one row, vertically centred on each other.
    expect(Math.abs((lang.y + lang.height / 2) - (signin.y + signin.height / 2))).toBeLessThanOrEqual(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('game: back link does not overlap the game header', async ({ page }) => {
    await page.goto('/game.html');
    const back = (await page.locator('#back-to-menu').boundingBox())!;
    const header = (await page.locator('.game-header').boundingBox())!;
    const lang = (await page.locator('#lang-switcher').boundingBox())!;
    expect(overlaps(back, header)).toBe(false);
    expect(overlaps(lang, header)).toBe(false);
    expect(overlaps(back, lang)).toBe(false);
  });

  test('main controls are at least 44px tall', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['#lang-switcher', '#google-signin-btn', '#sfx-toggle', '#music-toggle', '#code-input', '#code-btn', '.class-card-select', '.class-card-add', '#setup-toggle', 'a.btn-primary', '#daily-btn', '#wallet-chip', '.app-nav-link']) {
      const box = (await page.locator(sel).first().boundingBox())!;
      expect(box.height, sel).toBeGreaterThanOrEqual(44);
    }
    await page.locator('#formulas-btn').click();
    const close = (await page.locator('#formulas-close').boundingBox())!;
    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Text alternatives', () => {
  test('practice explains why it is unavailable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#practice-btn')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#practice-hint')).toBeVisible();
    await expect(page.locator('#practice-hint')).toHaveText('Zaloguj sie, aby korzystac z trybu cwiczen');
  });

  test('achievements say locked / unlocked in text', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('milionerzy_achievements', JSON.stringify(['first_game'])));
    await page.goto('/achievements.html');
    await expect(page.locator('.achievement-card.unlocked .achievement-status').first()).toHaveText('Odblokowane');
    await expect(page.locator('.achievement-card.locked .achievement-status').first()).toHaveText('Zablokowane');
  });

  test('skip link jumps to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await expect(page.locator('main#main')).toHaveCount(1);
  });
});
