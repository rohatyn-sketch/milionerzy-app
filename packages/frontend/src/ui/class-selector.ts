import { storage } from '../state/storage';
import { loadQuestionsForClass } from '../features/questions';
import { isLoggedIn } from '../auth/auth';
import { immediateSave } from '../state/sync';
import { deleteClassOnServer } from '../api/class.api';
import { t } from '../features/i18n';
import { openDialog } from './dialog';
import { icon } from './icons';

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

  // "Dodaj klase" is the one, labelled entry point to AI question sets. It
  // replaces both the unlabelled gear button in the corner (which looked like
  // Settings) and the separate "sign-in required" pop-up: signed-out players
  // get the same form with an inline sign-in prompt.
  const addCard = document.createElement('button');
  addCard.type = 'button';
  addCard.id = 'setup-toggle';
  addCard.className = 'class-card class-card-add';
  addCard.setAttribute('aria-haspopup', 'dialog');
  addCard.innerHTML = `
    <span class="class-card-add-icon" aria-hidden="true">${icon('plus', 24)}</span>
    <span class="class-card-add-text">${t('class.add', 'Dodaj klase')}</span>
    <span class="class-card-add-hint">${t('class.addHint', 'Wlasne pytania z AI')}</span>
  `;
  addCard.addEventListener('click', () => {
    const panel = document.getElementById('setup-panel');
    if (!panel) return;
    const first = isLoggedIn() ? document.getElementById('class-name-input') : document.getElementById('setup-signin-btn');
    openDialog(panel, { initialFocus: first });
  });
  container.appendChild(addCard);
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
