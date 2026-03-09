import { storage } from '../state/storage';
import { loadQuestionsForClass } from '../features/questions';

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
  container.innerHTML = '';

  registry.forEach(cls => {
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
    <div class="class-card-tooltip">Zaloguj sie, aby dodac nowa klase</div>
  `;
  addCard.addEventListener('click', () => {
    const panel = document.getElementById('setup-panel');
    if (panel) panel.classList.add('active');
  });
  container.appendChild(addCard);
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
