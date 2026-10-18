// dialog.ts - one behaviour for every modal overlay in the app.
//
// The overlays (formulas sheet, add-class panel) were plain divs toggled with
// an `.active` class: no dialog role, focus stayed behind the overlay, Tab
// walked into the page underneath and focus was lost on close. This helper
// implements the WAI-ARIA APG "Dialog (Modal)" pattern on top of the existing
// `.active` convention so the CSS and the e2e selectors keep working:
//   - focus moves into the dialog on open and returns to the opener on close
//   - Tab / Shift+Tab are contained inside the dialog
//   - Esc and a click on the backdrop close it
// The markup supplies role="dialog", aria-modal="true" and aria-labelledby.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openers = new WeakMap<HTMLElement, HTMLElement | null>();

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function isDialogOpen(dialog: HTMLElement): boolean {
  return dialog.classList.contains('active');
}

export function openDialog(dialog: HTMLElement, initialFocus?: HTMLElement | null): void {
  if (isDialogOpen(dialog)) return;
  openers.set(dialog, document.activeElement as HTMLElement | null);
  dialog.classList.add('active');
  dialog.removeAttribute('aria-hidden');
  // Wait a frame so the overlay is visible (visibility transitions) before focusing.
  requestAnimationFrame(() => {
    const target = initialFocus ?? focusables(dialog)[0];
    target?.focus();
  });
}

export function closeDialog(dialog: HTMLElement): void {
  if (!isDialogOpen(dialog)) return;
  dialog.classList.remove('active');
  dialog.setAttribute('aria-hidden', 'true');
  const opener = openers.get(dialog);
  if (opener && document.contains(opener)) opener.focus();
}

/**
 * Wire close button, backdrop click, Esc and the focus trap once per dialog.
 * `backdrop` is the element whose own clicks (not its children's) close it.
 */
export function setupDialog(dialog: HTMLElement, closeBtn?: HTMLElement | null, backdrop: HTMLElement = dialog): void {
  dialog.setAttribute('aria-hidden', isDialogOpen(dialog) ? 'false' : 'true');
  closeBtn?.addEventListener('click', () => closeDialog(dialog));
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDialog(dialog);
  });
  document.addEventListener('keydown', (e) => {
    if (!isDialogOpen(dialog)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog(dialog);
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables(dialog);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || !dialog.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  });
}
