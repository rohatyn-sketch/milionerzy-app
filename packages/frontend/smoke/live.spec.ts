import { test, expect, Page } from '@playwright/test';

// Runs against the live site after every deploy. SMOKE_BASE points the same
// user flows at another server (e.g. a local `vite preview`) to prove a change
// will pass before it ships; the hosting-only checks (old-host redirect,
// Cache-Control, auth domain) only make sense live and are skipped then.
const BASE = process.env.SMOKE_BASE ?? 'https://edufiszka.app';
const LIVE = !process.env.SMOKE_BASE;
const BASE_RE = BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const navs: string[] = [];
const dialogs: string[] = [];

async function finishGame(page: Page) {
  await page.waitForSelector('.answer-btn');
  for (let i = 0; i < 200; i++) {
    if (await page.locator('#end-screen').isVisible()) return;
    const next = page.locator('#next-btn');
    if (await next.isVisible()) { await next.click({ force: true, timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500); continue; }
    const btn = page.locator('.answer-btn:enabled').first();
    if (await btn.count()) { await btn.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500); continue; }
    await page.waitForTimeout(300);
  }
  throw new Error('game never ended');
}

async function expectOnNewDomain(page: Page, path: RegExp) {
  await page.waitForLoadState('load');
  expect(page.url()).toMatch(new RegExp('^' + BASE_RE + path.source));
}

test.beforeEach(async ({ page }) => {
  page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push(f.url()); });
  page.on('dialog', d => { dialogs.push(`${d.type()} on ${page.url()}`); d.accept(); });
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Pomin samouczek' }).click({ timeout: 5000 }).catch(() => {});
  await page.locator('input[type=range]').evaluate((el: HTMLInputElement) => {
    el.value = el.min; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

test.afterAll(() => {
  console.log('ALL NAVIGATIONS:\n' + navs.join('\n'));
  console.log('DIALOGS:\n' + dialogs.join('\n'));
  expect(navs.filter(u => /milionerzy\.app/.test(u))).toEqual([]);
});

test('full game -> Zobacz wynik -> Menu glowne', async ({ page }) => {
  await page.getByRole('link', { name: 'Graj', exact: true }).click();
  await finishGame(page);
  await expect(page.locator('#end-screen')).toBeVisible();
  await page.getByRole('link', { name: /menu glowne/i }).click();
  await expectOnNewDomain(page, /\/(index\.html)?$/);
  await expect(page.getByRole('heading', { name: 'EduFiszka' })).toBeVisible();
});

test('full game -> Zagraj ponownie, then mid-game back to menu', async ({ page }) => {
  await page.getByRole('link', { name: 'Graj', exact: true }).click();
  await finishGame(page);
  await page.getByRole('link', { name: /zagraj ponownie/i }).click();
  await expectOnNewDomain(page, /\/game\.html$/);
  await page.waitForSelector('.answer-btn');
  await page.locator('#back-to-menu').click();
  await expectOnNewDomain(page, /\/(index\.html)?$/);
});

test('daily challenge -> end -> Menu glowne', async ({ page }) => {
  await page.locator('#daily-btn').click();
  await finishGame(page);
  await page.getByRole('link', { name: /menu glowne/i }).click();
  await expectOnNewDomain(page, /\/(index\.html)?$/);
});

test('shop and achievements stay on new domain and link back', async ({ page }) => {
  await page.getByRole('link', { name: 'Sklep' }).click();
  await expectOnNewDomain(page, /\/shop\.html$/);
  await page.locator('a[href*="index"]').first().click();
  await expectOnNewDomain(page, /\/(index\.html)?$/);
  await page.goto(BASE + '/achievements.html');
  await expectOnNewDomain(page, /\/achievements\.html$/);
  await page.locator('a[href*="index"]').first().click();
  await expectOnNewDomain(page, /\/(index\.html)?$/);
});

test('old Firebase hosts redirect to edufiszka.app', async ({ page }) => {
  test.skip(!LIVE, 'hosting check: live site only');
  for (const p of ['/', '/game.html', '/shop.html', '/achievements.html']) {
    await page.goto('https://milionerzy.web.app' + p);
    await page.waitForURL(/^https:\/\/edufiszka\.app/);
  }
});

test('HTML is served no-cache', async ({ request }) => {
  test.skip(!LIVE, 'hosting check: live site only');
  for (const p of ['/', '/index.html', '/game.html', '/shop.html', '/achievements.html']) {
    const r = await request.get(BASE + p);
    expect(r.headers()['cache-control'], p).toBe('no-cache');
  }
});

test('sign-in uses edufiszka.app as auth domain', async ({ request }) => {
  test.skip(!LIVE, 'hosting check: live site only');
  const html = await (await request.get(BASE + '/')).text();
  const scripts = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map(m => m[1]);
  const bundles = await Promise.all(scripts.map(async s => (await request.get(BASE + s)).text()));
  const domains = bundles.flatMap(b => [...b.matchAll(/authDomain:"([^"]+)"/g)].map(m => m[1]));
  expect(domains.length).toBeGreaterThan(0);
  expect([...new Set(domains)]).toEqual(['edufiszka.app']);
});
