import { storage } from '../state/storage';
import { t } from './i18n';

// First-time player guide.
//
// A lightweight spotlight tour: it dims the page, cuts a highlight around a
// target element and shows a tooltip explaining it. The tour spans two pages —
// it introduces the main menu, then (once the player starts) the game screen —
// and finishes with a congratulation after the first game is completed.
//
// State lives in storage.getOnboarding(): null -> 'active' -> 'done'.

interface TourStep {
  // CSS selector of the element to highlight. Omit for a centered, page-level
  // card (welcome / finish screens).
  target?: string;
  title: string;
  text: string;
  // Label for the primary button on this step. Defaults to "Dalej", or
  // "Zakoncz" on the last step.
  nextLabel?: string;
}

interface TourOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  // Whether to show the "Pomin samouczek" (skip) control. The final
  // celebration screen hides it.
  allowSkip?: boolean;
}

let activeTour: Tour | null = null;

// True when the element sits in a fixed or sticky bar (the app bar, the phone
// tab bar): scrolling the page doesn't move it, so we don't scroll for it.
function isPinned(el: HTMLElement): boolean {
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const pos = getComputedStyle(n).position;
    if (pos === 'fixed' || pos === 'sticky') return true;
  }
  return false;
}

// Height of the sticky app bar at the top and the fixed tab bar at the bottom
// (phones), so a scrolled-to element doesn't end up hidden behind them.
function pinnedInsets(): { top: number; bottom: number } {
  const vh = window.innerHeight;
  let top = 0;
  let bottom = 0;
  const bar = document.querySelector<HTMLElement>('.app-bar');
  if (bar && getComputedStyle(bar).position === 'sticky') top = Math.max(0, bar.getBoundingClientRect().bottom);
  const nav = document.querySelector<HTMLElement>('.app-nav');
  if (nav && getComputedStyle(nav).position === 'fixed') bottom = Math.max(0, vh - nav.getBoundingClientRect().top);
  return { top, bottom };
}

class Tour {
  private steps: TourStep[];
  private opts: TourOptions;
  private index = 0;
  private overlay!: HTMLElement;
  private highlight!: HTMLElement;
  private tooltip!: HTMLElement;
  private titleEl!: HTMLElement;
  private textEl!: HTMLElement;
  private counterEl!: HTMLElement;
  private dotsEl!: HTMLElement;
  private nextBtn!: HTMLButtonElement;
  private skipBtn!: HTMLButtonElement;
  private reposition = (): void => this.positionForCurrentStep();

  constructor(steps: TourStep[], opts: TourOptions = {}) {
    this.steps = steps;
    this.opts = opts;
  }

  start(): void {
    if (activeTour) activeTour.teardown();
    activeTour = this;
    // Extra room at the bottom so any element can be scrolled up far enough
    // to leave space for the tooltip, even at the end of a short page.
    document.body.classList.add('tour-open');
    this.build();
    this.opts.onStart?.();
    this.showStep(0);

    window.addEventListener('resize', this.reposition);
    window.addEventListener('scroll', this.reposition, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  private build(): void {
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const highlight = document.createElement('div');
    highlight.className = 'tour-highlight';

    const tooltip = document.createElement('div');
    tooltip.className = 'tour-tooltip';
    tooltip.innerHTML = `
      <div class="tour-dots"></div>
      <h3 class="tour-title"></h3>
      <p class="tour-text"></p>
      <div class="tour-footer">
        <button type="button" class="tour-skip">${t('onb.skip', 'Pomin samouczek')}</button>
        <div class="tour-nav">
          <span class="tour-counter"></span>
          <button type="button" class="tour-next">Dalej</button>
        </div>
      </div>
    `;

    overlay.appendChild(highlight);
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.highlight = highlight;
    this.tooltip = tooltip;
    this.titleEl = tooltip.querySelector('.tour-title') as HTMLElement;
    this.textEl = tooltip.querySelector('.tour-text') as HTMLElement;
    this.counterEl = tooltip.querySelector('.tour-counter') as HTMLElement;
    this.dotsEl = tooltip.querySelector('.tour-dots') as HTMLElement;
    this.nextBtn = tooltip.querySelector('.tour-next') as HTMLButtonElement;
    this.skipBtn = tooltip.querySelector('.tour-skip') as HTMLButtonElement;

    this.nextBtn.addEventListener('click', () => this.next());
    this.skipBtn.addEventListener('click', () => this.skip());

    if (this.opts.allowSkip === false) this.skipBtn.style.display = 'none';

    // Build progress dots
    this.steps.forEach(() => {
      const dot = document.createElement('span');
      dot.className = 'tour-dot';
      this.dotsEl.appendChild(dot);
    });
    if (this.steps.length <= 1) this.dotsEl.style.display = 'none';
  }

  private showStep(i: number): void {
    this.index = i;
    const step = this.steps[i];

    this.titleEl.textContent = step.title;
    this.textEl.textContent = step.text;
    this.counterEl.textContent = `${i + 1} / ${this.steps.length}`;
    const isLast = i === this.steps.length - 1;
    this.nextBtn.textContent = step.nextLabel || (isLast ? t('onb.finish', 'Zakoncz') : t('onb.next', 'Dalej'));

    Array.from(this.dotsEl.children).forEach((dot, di) => {
      dot.classList.toggle('active', di === i);
      dot.classList.toggle('done', di < i);
    });

    // Expose the step for tests and tooling (which element is highlighted).
    this.overlay.dataset.step = String(i + 1);
    this.overlay.dataset.target = step.target ?? '';

    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    if (target && !isPinned(target)) this.scrollIntoViewWithTooltip(target);
    // Position after a frame so scrollIntoView and layout settle.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.positionForCurrentStep());
    });

    this.nextBtn.focus();
  }

  // Scroll so the highlighted element AND the tooltip under it both fit on
  // screen. (Centring the element alone left no room for the tooltip on
  // phones, so it covered part of the element, e.g. answer D.)
  private scrollIntoViewWithTooltip(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    const tipHeight = this.tooltip.getBoundingClientRect().height;
    const insets = pinnedInsets();
    const vh = window.innerHeight - insets.top - insets.bottom;
    const pad = 8;
    const margin = 14;
    const needed = rect.height + pad * 2 + margin + tipHeight;
    const desiredTop = insets.top + (needed + margin * 2 <= vh
      ? Math.max(margin + pad, (vh - needed) / 2 + pad)
      : Math.max(pad, (vh - rect.height) / 2));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: window.scrollY + rect.top - desiredTop, behavior: reduce ? 'auto' : 'smooth' });
  }

  private positionForCurrentStep(): void {
    const step = this.steps[this.index];
    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null;

    if (!target) {
      // Centered, page-level card: dim the whole screen, hide the cutout.
      this.overlay.classList.add('tour-overlay--plain');
      this.highlight.style.display = 'none';
      this.tooltip.classList.add('tour-tooltip--centered');
      this.tooltip.style.top = '';
      this.tooltip.style.left = '';
      return;
    }

    this.overlay.classList.remove('tour-overlay--plain');
    this.tooltip.classList.remove('tour-tooltip--centered');
    this.highlight.style.display = '';

    const rect = target.getBoundingClientRect();
    const pad = 8;
    const hx = Math.max(0, rect.left - pad);
    const hy = Math.max(0, rect.top - pad);
    const hw = rect.width + pad * 2;
    const hh = rect.height + pad * 2;
    this.highlight.style.left = `${hx}px`;
    this.highlight.style.top = `${hy}px`;
    this.highlight.style.width = `${hw}px`;
    this.highlight.style.height = `${hh}px`;

    // Place the tooltip below the target if there is room, otherwise above.
    const tipRect = this.tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 14;

    let top = hy + hh + margin;
    if (top + tipRect.height > vh - margin) {
      top = hy - tipRect.height - margin;
    }
    // If it fits neither below nor above, clamp into view.
    if (top < margin) top = Math.min(hy + hh + margin, vh - tipRect.height - margin);
    if (top < margin) top = margin;

    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(margin, Math.min(left, vw - tipRect.width - margin));

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  private next(): void {
    if (this.index < this.steps.length - 1) {
      this.showStep(this.index + 1);
    } else {
      this.finish();
    }
  }

  private finish(): void {
    this.teardown();
    this.opts.onComplete?.();
  }

  private skip(): void {
    this.teardown();
    this.opts.onSkip?.();
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Swallow keys so the tour can't accidentally trigger game shortcuts.
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.skip();
    } else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      this.next();
    } else {
      e.stopPropagation();
    }
  };

  private teardown(): void {
    window.removeEventListener('resize', this.reposition);
    window.removeEventListener('scroll', this.reposition, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.overlay.remove();
    document.body.classList.remove('tour-open');
    if (activeTour === this) activeTour = null;
  }
}

// --- Menu tour -------------------------------------------------------------

function menuSteps(): TourStep[] {
  // The Start page is laid out as "1 choose a subject -> 2 play", with
  // navigation and the wallet always visible, so the tour only points out
  // those few landmarks (the practice button explains itself in text).
  return [
    {
      title: t('onb.welcome.title', 'Witaj w EduFiszka!'),
      text: t('onb.welcome.text', 'To gra, w ktorej odpowiadasz na pytania i zdobywasz pieniadze. Pokazemy Ci w kilku krokach, jak grac.'),
    },
    {
      target: '#class-selector',
      title: t('onb.class.title', 'Wybierz przedmiot'),
      text: t('onb.class2.text', 'Krok 1: wybierz przedmiot, z ktorego chcesz grac. Przyciskiem "Dodaj klase" stworzysz wlasny zestaw pytan z AI (po zalogowaniu).'),
    },
    {
      target: '#play-controls',
      title: t('onb.play.title', 'Zagraj'),
      text: t('onb.play2.text', 'Krok 2: suwakiem ustaw liczbe pytan i nacisnij "Graj". Mniej pytan to szybsza gra.'),
    },
    {
      target: '#wallet-chip',
      title: t('onb.money.title', 'Twoje pieniadze'),
      text: t('onb.money2.text', 'Za poprawne odpowiedzi zdobywasz pieniadze. Stan konta widzisz zawsze tutaj, a wydasz je w Sklepie na kola ratunkowe i motywy.'),
    },
    {
      target: '.app-nav',
      title: t('onb.nav.title', 'Menu'),
      text: t('onb.nav.text', 'Start to ten ekran. W Postepach zobaczysz osiagniecia i najlepsze wyniki, a w Sklepie wydasz zarobione pieniadze.'),
    },
    {
      title: t('onb.final.title', 'Zagrajmy!'),
      text: t('onb.final.text', 'To wszystko, co musisz wiedziec na start. Kliknij ponizej, aby rozpoczac swoja pierwsza gre — dokonczymy samouczek w trakcie.'),
      nextLabel: t('onb.final.cta', 'Graj teraz'),
    },
  ];
}

// --- Game tour -------------------------------------------------------------

function gameSteps(): TourStep[] {
  return [
    {
      target: '.question-container',
      title: t('onb.g.question.title', 'Pytanie'),
      text: t('onb.g.question.text', 'Tu pojawia sie pytanie. Przeczytaj je uwaznie — zaraz wybierzesz odpowiedz.'),
    },
    {
      target: '#answers-container',
      title: t('onb.g.answers.title', 'Odpowiedzi'),
      text: t('onb.g.answers.text', 'Kliknij jedna z odpowiedzi. Mozesz tez uzyc klawiszy A/B/C/D lub 1/2/3/4.'),
    },
    {
      target: '.timer-container',
      title: t('onb.g.timer.title', 'Czas'),
      text: t('onb.g.timer.text', 'Na kazde pytanie masz ograniczony czas. Gdy pasek sie skonczy, pytanie przepada.'),
    },
    {
      target: '.lifelines-container',
      title: t('onb.g.lifelines.title', 'Kola ratunkowe'),
      text: t('onb.g.lifelines.text', '50:50 usuwa bledne odpowiedzi, "Pomin" przeskakuje pytanie, a "+Czas" dodaje sekundy. Kupisz je w sklepie.'),
    },
    {
      target: '.current-money, #current-money',
      title: t('onb.g.money.title', 'Zarobek'),
      text: t('onb.g.money.text', 'Tutaj na biezaco widzisz, ile zarobiles w tej grze.'),
    },
    {
      title: t('onb.g.final.title', 'Powodzenia!'),
      text: t('onb.g.final.text', 'Teraz Twoja kolej. Odpowiedz na wszystkie pytania — po ukonczeniu gry zakonczymy samouczek.'),
      nextLabel: t('onb.g.final.cta', 'Zaczynam'),
    },
  ];
}

/**
 * Returns true when the current visitor is a brand-new player who should see
 * the first-time guide. Also migrates pre-existing players (who have games
 * under their belt but no onboarding flag) straight to 'done' so the tutorial
 * never ambushes them.
 */
export function isFirstTimePlayer(): boolean {
  const state = storage.getOnboarding();
  if (state === 'done') return false;
  if (state === 'active') return true;
  // state === null
  if ((storage.getGamesPlayed() || 0) > 0) {
    storage.setOnboarding('done');
    return false;
  }
  return true;
}

/** Starts the main-menu portion of the first-time guide. */
export function startMenuOnboarding(): void {
  if (storage.getOnboarding() === 'done') return;

  new Tour(menuSteps(), {
    onComplete: () => {
      // Mark the tour as in-progress and send the player into their first game.
      storage.setOnboarding('active');
      window.location.href = 'game.html';
    },
    onSkip: () => {
      // Respect the opt-out: don't nag on future visits.
      storage.setOnboarding('done');
    },
  }).start();
}

/**
 * Starts the in-game portion of the guide. `pause`/`resume` let the caller
 * freeze the question timer (and keyboard shortcuts) while the tour is open.
 */
export function startGameOnboarding(hooks: { pause?: () => void; resume?: () => void } = {}): void {
  if (storage.getOnboarding() === 'done') return;
  storage.setOnboarding('active');

  new Tour(gameSteps(), {
    onStart: hooks.pause,
    onComplete: hooks.resume,
    onSkip: hooks.resume,
  }).start();
}

/**
 * Shows the closing celebration once the first game is finished, and marks the
 * tutorial complete. No-op if the player isn't mid-tutorial.
 */
export function finishOnboarding(): void {
  if (storage.getOnboarding() !== 'active') return;
  storage.setOnboarding('done');

  new Tour(
    [
      {
        title: t('onb.done.title', 'Samouczek ukonczony!'),
        text: t('onb.done.text', 'Gratulacje — ukonczyles swoja pierwsza gre! Znasz juz podstawy. Graj dalej, zdobywaj pieniadze i odblokowuj osiagniecia.'),
        nextLabel: t('onb.done.cta', 'Super!'),
      },
    ],
    {
      allowSkip: false,
      // Hand keyboard focus back to the end screen's first action.
      onComplete: () => document.querySelector<HTMLElement>('#end-screen.active .end-buttons a')?.focus(),
    },
  ).start();
}
