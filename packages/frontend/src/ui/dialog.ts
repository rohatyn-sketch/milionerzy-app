// dialog.ts - one behaviour for every modal overlay in the app.
//
// The overlays (formulas sheet, add-class panel, sign-in prompt, podcast
// player) were plain divs toggled with an `.active` class: no dialog role,
// focus stayed behind the overlay, Tab walked into the page underneath and
// focus was lost on close. This helper implements the WAI-ARIA APG
// "Dialog (Modal)" pattern on top of the existing `.active` convention so the
// CSS and the e2e selectors keep working:
//   - focus moves into the dialog on open and returns to the opener on close
//   - Tab / Shift+Tab stay inside the dialog
//   - Esc and a click on the backdrop close it
// The markup supplies role="dialog", aria-modal="true" and aria-labelledby.
//
// One document-level key handler serves every dialog (top-most wins). It runs
// in the capture phase and stops the event, so Esc closes the dialog instead
// of also reaching page shortcuts (e.g. the game's "Esc = leave game").

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogState {
  opener: HTMLElement | null;
  onClose?: () => void;
}

const open = new Map<HTMLElement, DialogState>();
const stack: HTMLElement[] = [];
let keyHandlerBound = false;

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
  );
}

function onKeyDown(e: KeyboardEvent): void {
  const top = stack[stack.length - 1];
  if (!top) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeDialog(top);
    return;
  }

  if (e.key !== 'Tab') return;
  const items = focusables(top);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey && (active === first || !top.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !top.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

function bindKeys(): void {
  if (keyHandlerBound) return;
  keyHandlerBound = true;
  document.addEventListener('keydown', onKeyDown, true);
}

export function isDialogOpen(dialog: HTMLElement): boolean {
  return open.has(dialog);
}

export interface OpenOptions {
  /** Element to focus first (defaults to the first focusable element). */
  initialFocus?: HTMLElement | null;
  /** Called after the dialog closes (Esc, backdrop, close button or code). */
  onClose?: () => void;
}

export function openDialog(dialog: HTMLElement, opts: OpenOptions = {}): void {
  bindKeys();
  if (open.has(dialog)) return;
  open.set(dialog, { opener: document.activeElement as HTMLElement | null, onClose: opts.onClose });
  stack.push(dialog);
  dialog.classList.add('active');
  dialog.removeAttribute('aria-hidden');
  // Wait a frame so the overlay is visible before focusing into it.
  requestAnimationFrame(() => {
    const target = opts.initialFocus ?? focusables(dialog)[0];
    target?.focus({ preventScroll: true });
  });
}

export function closeDialog(dialog: HTMLElement): void {
  const state = open.get(dialog);
  if (!state) return;
  open.delete(dialog);
  const i = stack.lastIndexOf(dialog);
  if (i >= 0) stack.splice(i, 1);
  dialog.classList.remove('active');
  dialog.setAttribute('aria-hidden', 'true');
  if (state.opener && document.contains(state.opener)) state.opener.focus();
  state.onClose?.();
}

/**
 * Wire the close button and backdrop click once per dialog.
 * `backdrop` is the element whose own clicks (not its children's) close it.
 */
export function setupDialog(dialog: HTMLElement, closeBtn?: HTMLElement | null, backdrop: HTMLElement = dialog): void {
  bindKeys();
  if (!open.has(dialog)) dialog.setAttribute('aria-hidden', 'true');
  closeBtn?.addEventListener('click', () => closeDialog(dialog));
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDialog(dialog);
  });
}
