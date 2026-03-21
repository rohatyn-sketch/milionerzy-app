import type { Question } from '@milionerzy/shared';
import { generatePodcast } from '../api/podcast.api';
import { showAudioPlayer, hideAudioPlayer } from './audio-player';

let popupEl: HTMLElement | null = null;
let isGenerating = false;
let abortController: AbortController | null = null;

const LOADING_MESSAGES = [
  'Szukam zrodel na ten temat...',
  'Przygotowuje material edukacyjny...',
  'Pisze scenariusz podcastu...',
  'Nagrywam podcast...',
  'Juz prawie gotowe...',
];

function createPopupHTML(question: Question, wrongCount: number): string {
  const emoji = wrongCount >= 3 ? '🤔' : '💡';
  const message = wrongCount >= 3
    ? 'Ten temat ciagle sprawia Ci trudnosci! Czas na pomoc specjalna.'
    : 'Ten temat pojawia sie nie pierwszy raz. Moze warto go doglebniej poznac?';

  return `
    <div class="learn-more-popup" id="learn-more-popup">
      <div class="learn-more-box">
        <div class="learn-more-header">
          <span class="learn-more-emoji">${emoji}</span>
          <h2 class="learn-more-title">Chcesz lepiej to zrozumiec?</h2>
        </div>
        <p class="learn-more-message">${message}</p>
        <p class="learn-more-topic">Temat: <strong>${question.category || 'Ogolny'}</strong></p>
        <p class="learn-more-desc">Stworzymy dla Ciebie krotki podcast edukacyjny, ktory wyjasni ten temat w przystepny sposob!</p>
        <div class="learn-more-buttons">
          <button class="btn btn-primary learn-more-generate" id="learn-more-generate">
            Generuj podcast
          </button>
          <button class="btn btn-secondary learn-more-dismiss" id="learn-more-dismiss">
            Moze pozniej
          </button>
        </div>
        <div class="learn-more-loading" id="learn-more-loading" style="display: none;">
          <div class="learn-more-spinner"></div>
          <p class="learn-more-loading-text" id="learn-more-loading-text">${LOADING_MESSAGES[0]}</p>
          <button class="btn btn-secondary learn-more-cancel" id="learn-more-cancel">Anuluj</button>
        </div>
      </div>
    </div>
  `;
}

function cycleLoadingMessages(textEl: HTMLElement): ReturnType<typeof setInterval> {
  let idx = 0;
  return setInterval(() => {
    idx = (idx + 1) % LOADING_MESSAGES.length;
    textEl.textContent = LOADING_MESSAGES[idx];
  }, 4000);
}

export function showLearnMorePopup(question: Question, wrongCount: number): void {
  // Remove existing popup if any
  hideLearnMorePopup();

  const html = createPopupHTML(question, wrongCount);
  document.body.insertAdjacentHTML('beforeend', html);
  popupEl = document.getElementById('learn-more-popup');

  // Animate in
  requestAnimationFrame(() => {
    popupEl?.classList.add('active');
  });

  const generateBtn = document.getElementById('learn-more-generate');
  const dismissBtn = document.getElementById('learn-more-dismiss');

  generateBtn?.addEventListener('click', () => handleGenerate(question));
  dismissBtn?.addEventListener('click', () => hideLearnMorePopup());
}

async function handleGenerate(question: Question): Promise<void> {
  if (isGenerating) return;
  isGenerating = true;

  const buttonsEl = popupEl?.querySelector('.learn-more-buttons') as HTMLElement | null;
  const loadingEl = document.getElementById('learn-more-loading');
  const loadingTextEl = document.getElementById('learn-more-loading-text');
  const cancelBtn = document.getElementById('learn-more-cancel');

  if (buttonsEl) buttonsEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  const messageInterval = loadingTextEl ? cycleLoadingMessages(loadingTextEl) : null;
  abortController = new AbortController();

  cancelBtn?.addEventListener('click', () => {
    abortController?.abort();
    hideLearnMorePopup();
  });

  try {
    const correctAnswer = question.answers.find(a => a.correct);
    const result = await generatePodcast({
      questionText: question.question,
      category: question.category || '',
      correctAnswer: correctAnswer?.text || '',
      explanation: question.explanation || '',
    });

    if (messageInterval) clearInterval(messageInterval);
    hideLearnMorePopup();
    showAudioPlayer(result.audioUrl, result.title, result.script);
  } catch (err: any) {
    if (messageInterval) clearInterval(messageInterval);
    if (err.name === 'AbortError') return;

    // Show error state
    if (loadingEl) loadingEl.style.display = 'none';
    if (buttonsEl) {
      buttonsEl.style.display = 'flex';
      buttonsEl.innerHTML = `
        <p class="learn-more-error">Nie udalo sie wygenerowac podcastu. Sprobuj pozniej.</p>
        <button class="btn btn-secondary learn-more-dismiss" id="learn-more-dismiss-retry">OK</button>
      `;
      document.getElementById('learn-more-dismiss-retry')?.addEventListener('click', () => hideLearnMorePopup());
    }
  } finally {
    isGenerating = false;
    abortController = null;
  }
}

export function hideLearnMorePopup(): void {
  if (popupEl) {
    popupEl.classList.remove('active');
    setTimeout(() => {
      popupEl?.remove();
      popupEl = null;
    }, 300);
  }
  isGenerating = false;
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}
