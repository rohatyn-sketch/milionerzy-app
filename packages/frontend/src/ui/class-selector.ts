import { storage } from '../state/storage';
import { loadQuestionsForClass } from '../features/questions';
import { isLoggedIn, signIn } from '../auth/auth';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderClassCards(onUpdate?: () => void): void {
  const container = document.getElementById('class-selector');
  if (!container) return;

  const registry = storage.getClassesRegistry() || [];
  const activeId = storage.getActiveClass();
  const loggedIn = isLoggedIn();
  container.innerHTML = '';

  registry.forEach(cls => {
    // Hide non-default classes when logged out
    if (!cls.isDefault && !loggedIn) return;

    const card = document.createElement('div');
    card.className = 'class-card' + (cls.id === activeId ? ' active' : '');
    card.dataset.classId = cls.id;

    let inner = `<div class="class-card-name">${escapeHtml(cls.name)}</div>`;
    inner += `<div class="class-card-info">${cls.questionCount || 0} pytan</div>`;
    if (cls.isDefault) {
      inner += `<div class="class-card-badge">Domyslna</div>`;
    } else {
      inner += `<button class="class-card-delete" title="Usun klase">&times;</button>`;
    }
    card.innerHTML = inner;

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('class-card-delete')) return;
      selectClass(cls.id, onUpdate);
    });

    if (!cls.isDefault) {
      card.querySelector('.class-card-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Czy na pewno chcesz usunac klase "${cls.name}"?`)) {
          deleteClass(cls.id, onUpdate);
        }
      });
    }

    container.appendChild(card);
  });

  // Add "+" card
  const addCard = document.createElement('div');
  addCard.className = 'class-card class-card-add';
  addCard.innerHTML = `
    <div class="class-card-add-icon">+</div>
    <div class="class-card-add-text">Dodaj klase</div>
  `;
  addCard.addEventListener('click', () => {
    if (!isLoggedIn()) {
      showLoginPrompt();
      return;
    }
    const panel = document.getElementById('setup-panel');
    if (panel) panel.classList.add('active');
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
    <div class="login-prompt-box">
      <button class="login-prompt-close" id="login-prompt-close">&times;</button>
      <h3 class="login-prompt-title">Wymagane logowanie</h3>
      <p class="login-prompt-text">Aby dodawac nowe klasy i generowac pytania, musisz sie zalogowac kontem Google.</p>
      <button class="google-signin-btn" id="login-prompt-signin">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Zaloguj przez Google
      </button>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  document.getElementById('login-prompt-close')?.addEventListener('click', () => overlay.remove());
  document.getElementById('login-prompt-signin')?.addEventListener('click', () => {
    overlay.remove();
    signIn();
  });
}

function selectClass(classId: string, onUpdate?: () => void): void {
  storage.setActiveClass(classId);
  loadQuestionsForClass(classId);
  renderClassCards(onUpdate);
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
}
