import { storage } from '../state/storage';
import { loadQuestionsForClass } from '../features/questions';
import { isLoggedIn, signIn } from '../auth/auth';
import { immediateSave } from '../state/sync';
import { deleteClassOnServer } from '../api/class.api';
import { t } from '../features/i18n';
import { openDialog, setupDialog, closeDialog } from './dialog';

let savedOnUpdate: (() => void) | undefined;

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderClassCards(onUpdate?: () => void): void {
  // Persist the callback so re-renders from auth.ts (without callback) still work
  if (onUpdate) savedOnUpdate = onUpdate;
  const effectiveOnUpdate = onUpdate || savedOnUpdate;

  const container = document.getElementById('class-selector');
  if (!container) return;

  const registry = storage.getClassesRegistry() || [];
  const activeId = storage.getActiveClass();
  const loggedIn = isLoggedIn();
  container.innerHTML = '';

  // Each card holds a real <button> (keyboard and screen-reader operable;
  // aria-pressed tells which subject is chosen) plus, for custom classes, a
  // separate labelled delete button. Before, the card was a clickable <div>
  // that keyboard users could not reach.
  registry.forEach(cls => {
    // Hide non-default classes when logged out
    if (!cls.isDefault && !loggedIn) return;

    const isActive = cls.id === activeId;
    const card = document.createElement('div');
    card.className = 'class-card' + (isActive ? ' active' : '');
    card.dataset.classId = cls.id;

    let inner = `
      <button type="button" class="class-card-select" aria-pressed="${isActive}">
        <span class="class-card-name">${escapeHtml(cls.name)}</span>
        <span class="class-card-info">${t('class.questions', '{n} pytan', { n: cls.questionCount || 0 })}</span>
        ${cls.isDefault ? `<span class="class-card-badge">${t('class.default', 'Domyslna')}</span>` : ''}
      </button>`;
    if (!cls.isDefault) {
      const label = `${t('class.deleteTitle', 'Usun klase')}: ${escapeHtml(cls.name)}`;
      inner += `<button type="button" class="class-card-delete" title="${label}" aria-label="${label}">&times;</button>`;
    }
    card.innerHTML = inner;

    card.querySelector('.class-card-select')!.addEventListener('click', () => {
      selectClass(cls.id, effectiveOnUpdate);
    });

    if (!cls.isDefault) {
      card.querySelector('.class-card-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(t('class.deleteConfirm', 'Czy na pewno chcesz usunac klase "{name}"?', { name: cls.name }))) {
          deleteClass(cls.id, effectiveOnUpdate);
        }
      });
    }

    container.appendChild(card);
  });

  // Add "+" card (a real button, so it is keyboard operable)
  const addCard = document.createElement('button');
  addCard.type = 'button';
  addCard.className = 'class-card class-card-add';
  addCard.setAttribute('aria-haspopup', 'dialog');
  addCard.innerHTML = `
    <span class="class-card-add-icon" aria-hidden="true">+</span>
    <span class="class-card-add-text">${t('class.add', 'Dodaj klase')}</span>
  `;
  addCard.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showLoginPrompt();
      return;
    }
    const panel = document.getElementById('setup-panel');
    if (panel) openDialog(panel, { initialFocus: document.getElementById('class-name-input') });
  });
  container.appendChild(addCard);
}

function showLoginPrompt(): void {
  // Remove existing prompt if any
  document.getElementById('login-prompt-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-prompt-overlay';
  overlay.className = 'login-prompt-overlay';
  overlay.innerHTML = `
    <div class="login-prompt-box" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title" aria-describedby="login-prompt-text">
      <button type="button" class="login-prompt-close" id="login-prompt-close" aria-label="${t('common.close', 'Zamknij')}">&times;</button>
      <h2 class="login-prompt-title" id="login-prompt-title">${t('login.title', 'Wymagane logowanie')}</h2>
      <p class="login-prompt-text" id="login-prompt-text">${t('login.text', 'Aby dodawac nowe klasy i generowac pytania, musisz sie zalogowac kontem Google.')}</p>
      <button type="button" class="google-signin-btn" id="login-prompt-signin">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        ${t('auth.signIn', 'Zaloguj przez Google')}
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Dialog behaviour (focus, Tab trap, Esc, backdrop) from ui/dialog.ts; the
  // element is removed once it closes.
  setupDialog(overlay, document.getElementById('login-prompt-close'));
  openDialog(overlay, {
    initialFocus: document.getElementById('login-prompt-signin'),
    onClose: () => overlay.remove(),
  });
  document.getElementById('login-prompt-signin')?.addEventListener('click', () => {
    signIn();
    closeDialog(overlay);
  });
}

function selectClass(classId: string, onUpdate?: () => void): void {
  storage.setActiveClass(classId);
  loadQuestionsForClass(classId);
  renderClassCards(onUpdate);
  // The cards were re-rendered; keep keyboard focus on the chosen one.
  document.querySelector<HTMLElement>(`.class-card[data-class-id="${classId}"] .class-card-select`)?.focus();
  onUpdate?.();
}

function deleteClass(classId: string, onUpdate?: () => void): void {
  const activeId = storage.getActiveClass();
  storage.removeClass(classId);

  if (activeId === classId) {
    storage.setActiveClass('default_fizyka7');
    loadQuestionsForClass('default_fizyka7');
  }

  renderClassCards(onUpdate);
  onUpdate?.();

  // Classes live in a server subcollection that plain progress-sync doesn't
  // touch, so without this the deleted class is merged back in on the next
  // reload/login. Delete it server-side, and persist the activeClassId change.
  if (isLoggedIn()) {
    deleteClassOnServer(classId).catch((err) =>
      console.error('[Class] Nie udalo sie usunac klasy na serwerze:', err));
    immediateSave();
  }
}
