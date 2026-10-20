// Top-right header: language + account controls in one aligned row, and the
// signed-in account menu (avatar -> name, email, "Wyloguj").
import { expect, test, type Page } from '@playwright/test';
import { FAKE_USER, signInFake } from '../helpers/fake-auth';

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 },
];

async function centreY(page: Page, selector: string): Promise<{ mid: number; height: number }> {
  const b = (await page.locator(selector).boundingBox())!;
  return { mid: b.y + b.height / 2, height: b.height };
}

async function expectAlignedRow(page: Page, other: string): Promise<void> {
  const lang = await centreY(page, '#lang-switcher');
  const ctrl = await centreY(page, other);
  expect(Math.abs(lang.mid - ctrl.mid), 'vertically centred on each other').toBeLessThanOrEqual(1);
  expect(Math.abs(lang.height - ctrl.height), 'same height').toBeLessThanOrEqual(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'no sideways scroll').toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('milionerzy_onboarding', 'done'));
});

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} ${vp.width}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('signed out: language and sign-in are one aligned row', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#google-signin-btn')).toBeVisible();
      await expect(page.locator('#google-signin-btn')).toContainText(vp.width < 480 ? 'Zaloguj' : 'Zaloguj przez Google');
      await expectAlignedRow(page, '#google-signin-btn');
    });

    test('signed in: avatar only in the bar, aligned with language', async ({ page }) => {
      await signInFake(page);
      const btn = page.locator('#account-btn');
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute('aria-label', `Konto: ${FAKE_USER.displayName}`);
      await expect(btn).toHaveText('AK'); // initials when there is no photo
      await expect(page.locator('#account-panel')).toBeHidden();
      await expect(page.locator('#logout-btn')).toBeHidden();
      await expectAlignedRow(page, '#account-btn');
    });
  });
}

test('account menu: opens with name, email and Wyloguj; Esc and outside click close it', async ({ page }) => {
  await signInFake(page);
  const btn = page.locator('#account-btn');
  const panel = page.locator('#account-panel');

  await btn.click();
  await expect(panel).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toContainText(FAKE_USER.displayName);
  await expect(panel).toContainText(FAKE_USER.email);
  await expect(page.getByRole('menuitem', { name: 'Wyloguj' })).toBeFocused();
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(btn).toBeFocused();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');

  await btn.click();
  await expect(panel).toBeVisible();
  await page.locator('h1.title').click();
  await expect(panel).toBeHidden();
});

test('account menu: a broken profile photo falls back to initials', async ({ page }) => {
  await page.route('https://broken.example/**', (r) => r.abort());
  await signInFake(page, { ...FAKE_USER, photoURL: 'https://broken.example/me.png' });
  await expect(page.locator('#account-btn')).toHaveText('AK');
  await expect(page.locator('#account-btn img')).toHaveCount(0);
});
