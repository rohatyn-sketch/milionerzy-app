// Walks the ENTIRE first-time tutorial, step by step, the way a new player
// would: the menu tour, the in-game tour, a complete first game and the
// closing "tutorial complete" card. At every step it checks that:
//   - the step title is the expected text in the chosen language,
//   - the highlighted element exists, is visible and is fully inside the
//     viewport (so the player can actually see what is being explained),
//   - the highlight frame sits on that element,
//   - the tooltip is fully on screen and does not cover the element.
// It runs in Polish and English, on a phone (375px) and a desktop (1280px).
//
// Uses the raw Playwright `test` (not the shared fixture) so the tutorial is
// NOT pre-dismissed.
import { expect, test, type Page } from '@playwright/test';

type Lang = 'pl' | 'en';

interface Step {
  // Element the step highlights (null = centred card with no highlight).
  target: string | null;
  title: Record<Lang, string>;
  // Optional: text the highlighted element must contain.
  targetText?: Record<Lang, RegExp>;
}

const MENU_STEPS: Step[] = [
  { target: null, title: { pl: 'Witaj w EduFiszka!', en: 'Welcome to EduFiszka!' } },
  {
    target: '#class-selector',
    title: { pl: 'Wybierz przedmiot', en: 'Pick a subject' },
    targetText: { pl: /Fizyka - Klasa 7/, en: /Fizyka - Klasa 7/ },
  },
  {
    target: '#question-count-control',
    title: { pl: 'Liczba pytan', en: 'Number of questions' },
    targetText: { pl: /Liczba pytan/, en: /Questions/ },
  },
  {
    target: '.menu-buttons .btn-primary',
    title: { pl: 'Zagraj', en: 'Play' },
    targetText: { pl: /^Graj$/, en: /^Play$/ },
  },
  {
    target: '.money-display',
    title: { pl: 'Twoje pieniadze', en: 'Your money' },
    targetText: { pl: /PLN/, en: /PLN/ },
  },
  {
    target: '#practice-btn',
    title: { pl: 'Tryb cwiczen', en: 'Practice mode' },
    targetText: { pl: /Cwicz/, en: /Practice/ },
  },
  { target: null, title: { pl: 'Zagrajmy!', en: "Let's play!" } },
];

const GAME_STEPS: Step[] = [
  { target: '.question-container', title: { pl: 'Pytanie', en: 'Question' } },
  { target: '#answers-container', title: { pl: 'Odpowiedzi', en: 'Answers' } },
  { target: '.timer-container', title: { pl: 'Czas', en: 'Time' }, targetText: { pl: /\d+s/, en: /\d+s/ } },
  {
    target: '.lifelines-container',
    title: { pl: 'Kola ratunkowe', en: 'Lifelines' },
    targetText: { pl: /50:50/, en: /50:50/ },
  },
  {
    target: '.current-money, #current-money',
    title: { pl: 'Zarobek', en: 'Earnings' },
    targetText: { pl: /PLN/, en: /PLN/ },
  },
  { target: null, title: { pl: 'Powodzenia!', en: 'Good luck!' } },
];

const DONE_TITLE: Record<Lang, string> = { pl: 'Samouczek ukonczony!', en: 'Tutorial complete!' };
const SKIP_LABEL: Record<Lang, string> = { pl: 'Pomin samouczek', en: 'Skip tutorial' };

type Box = { x: number; y: number; width: number; height: number };

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function checkStep(page: Page, steps: Step[], i: number, lang: Lang): Promise<void> {
  const step = steps[i];
  const overlay = page.locator('.tour-overlay');
  const vp = page.viewportSize()!;

  await expect(overlay).toHaveAttribute('data-step', String(i + 1));
  await expect(page.locator('.tour-counter')).toHaveText(`${i + 1} / ${steps.length}`);
  await expect(page.locator('.tour-title')).toHaveText(step.title[lang]);
  await expect(page.locator('.tour-text')).not.toBeEmpty();
  await expect(overlay).toHaveAttribute('data-target', step.target ?? '');

  if (!step.target) {
    await expect(page.locator('.tour-highlight')).toBeHidden();
  } else {
    const target = page.locator(step.target).first();
    await expect(target, `step ${i + 1}: target ${step.target} exists`).toHaveCount(1);
    await expect(target, `step ${i + 1}: target is visible`).toBeVisible();
    if (step.targetText) await expect(target).toContainText(step.targetText[lang]);

    // Fully inside the viewport once the smooth scroll has settled.
    await expect
      .poll(async () => {
        const b = await target.boundingBox();
        if (!b) return 'no box';
        const inside = b.x >= -1 && b.y >= -1 && b.x + b.width <= vp.width + 1 && b.y + b.height <= vp.height + 1;
        return inside ? 'inside' : `outside ${JSON.stringify(b)}`;
      }, { message: `step ${i + 1}: ${step.target} fully in viewport`, timeout: 5000 })
      .toBe('inside');

    // The highlight frame surrounds the element (8px padding in the tour).
    await expect
      .poll(async () => {
        const t = await target.boundingBox();
        const h = await page.locator('.tour-highlight').boundingBox();
        if (!t || !h) return 'missing';
        const ok = h.x <= t.x + 1 && h.y <= t.y + 1 && h.x + h.width >= t.x + t.width - 1 && h.y + h.height >= t.y + t.height - 1
          && Math.abs(h.width - t.width) <= 20 && Math.abs(h.height - t.height) <= 20;
        return ok ? 'framed' : `highlight ${JSON.stringify(h)} vs target ${JSON.stringify(t)}`;
      }, { message: `step ${i + 1}: highlight frames ${step.target}`, timeout: 5000 })
      .toBe('framed');

    // The tooltip does not hide the thing it is talking about (polled: the
    // tooltip glides into place with a short transition).
    await expect
      .poll(async () => {
        const t = await target.boundingBox();
        const tip = await page.locator('.tour-tooltip').boundingBox();
        if (!t || !tip) return 'missing';
        return intersects(t, tip) ? `tooltip ${JSON.stringify(tip)} covers ${JSON.stringify(t)}` : 'clear';
      }, { message: `step ${i + 1}: tooltip does not cover ${step.target}`, timeout: 5000 })
      .toBe('clear');
  }

  // Tooltip fully on screen (title, text and buttons readable/tappable).
  await expect
    .poll(async () => {
      const b = await page.locator('.tour-tooltip').boundingBox();
      if (!b) return 'no box';
      return b.x >= 0 && b.y >= 0 && b.x + b.width <= vp.width && b.y + b.height <= vp.height ? 'inside' : JSON.stringify(b);
    }, { message: `step ${i + 1}: tooltip on screen` })
    .toBe('inside');
}

async function walk(page: Page, steps: Step[], lang: Lang): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    await checkStep(page, steps, i, lang);
    await expect(page.getByRole('button', { name: SKIP_LABEL[lang] })).toBeVisible();
    if (i < steps.length - 1) await page.locator('.tour-next').click();
  }
}

async function finishGame(page: Page): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (await page.locator('#end-screen.active').count()) return;
    const next = page.locator('#explanation-overlay.active #next-btn');
    if (await next.count()) {
      await next.click();
      continue;
    }
    const answer = page.locator('.answer-btn:enabled').first();
    if (await answer.count()) {
      await answer.click().catch(() => {});
      await page.waitForSelector('#explanation-overlay.active', { timeout: 10_000 });
      continue;
    }
    await page.waitForTimeout(200);
  }
  throw new Error('game never ended');
}

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 667 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  for (const lang of ['pl', 'en'] as Lang[]) {
    test(`full tutorial walkthrough (${lang.toUpperCase()}, ${vp.name} ${vp.width}px)`, async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(([l]) => {
        try {
          localStorage.setItem('milionerzy_lang', l);
          // Short first game so the test reaches the closing card quickly.
          localStorage.setItem('milionerzy_question_count', '5');
        } catch { /* ignore */ }
      }, [lang]);

      await page.goto('/');
      await expect(page.locator('.tour-overlay')).toBeVisible();

      await test.step('menu tour', async () => {
        await walk(page, MENU_STEPS, lang);
        await expect(page.locator('.tour-next')).toHaveText(lang === 'pl' ? 'Graj teraz' : 'Play now');
        await Promise.all([page.waitForURL('**/game.html'), page.locator('.tour-next').click()]);
      });

      await test.step('in-game tour', async () => {
        await expect(page.locator('.tour-overlay')).toBeVisible();
        await walk(page, GAME_STEPS, lang);
        await page.locator('.tour-next').click();
        await expect(page.locator('.tour-overlay')).toHaveCount(0);
      });

      await test.step('first game, then the closing card', async () => {
        await finishGame(page);
        await expect(page.locator('.tour-title')).toHaveText(DONE_TITLE[lang]);
        await expect(page.locator('.tour-skip')).toBeHidden();
        await checkStep(page, [{ target: null, title: DONE_TITLE }], 0, lang);
        await page.locator('.tour-next').click();
        await expect(page.locator('.tour-overlay')).toHaveCount(0);
        await expect(page.locator('#end-screen')).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem('milionerzy_onboarding'))).toBe('done');
      });

      expect(errors, 'no page errors').toEqual([]);
    });
  }
}
