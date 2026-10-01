import { test as base, expect } from '@playwright/test';

// Shared test fixture.
//
// A brand-new visitor (empty localStorage) triggers the first-time onboarding
// tour, whose full-screen overlay intercepts clicks on the menu and game. These
// functional specs aren't testing onboarding, so we seed it as already finished
// before any page script runs. addInitScript re-runs on every navigation and
// reload, so the flag survives the page.reload()s some specs perform.
//
// The dedicated onboarding spec imports the raw `test` from '@playwright/test'
// so it can exercise the tour on a genuinely fresh visit.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('milionerzy_onboarding', 'done');
      } catch {
        /* localStorage may be unavailable before first navigation; ignore */
      }
    });
    await use(page);
  },
});

export { expect };
