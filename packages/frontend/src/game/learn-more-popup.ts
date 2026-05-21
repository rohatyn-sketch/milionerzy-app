import type { Question } from '@milionerzy/shared';
import { generatePodcast, type PodcastInfo } from '../api/podcast.api';
import { showAudioPlayer } from './audio-player';

let toastEl: HTMLElement | null = null;
let isGenerating = false;
let abortController: AbortController | null = null;
let dismissedForSession = false;
let onPodcastGenerated: ((questionText: string, podcast: PodcastInfo) => void) | null = null;
let autoHideTimer: ReturnType<typeof setTimeout> | null = null;

const LOADING_MESSAGES = [
  'Szukam zrodel na ten temat...',
  'Przygotowuje material edukacyjny...',
  'Pisze scenariusz podcastu...',
  'Nagrywam podcast...',
  'Juz prawie gotowe...',
];

const ROBOT_FRAMES = [
  '(o_o)',
  '(O_o)',
  '(o_O)',
  '(O_O)',
  '(^_^)',
  '(>_<)',
  '(@_@)',
  '(^_~)',
];

function createToastHTML(question: Question, wrongCount: number): string {
  const message = wrongCount >= 3
    ? 'Ten temat Ci nie odpuszcza!'
    : 'Znow ten temat?';

  return `
    <div class="learn-toast" id="learn-toast">
      <div class="learn-toast-content">
        <div class="learn-toast-icon">🎧</div>
        <div class="learn-toast-text">
          <p class="learn-toast-message"><strong>${message}</strong> Wygenerowac podcast o <em>${question.category || 'tym temacie'}</em>?</p>
        </div>
        <div class="learn-toast-actions">
          <button class="learn-toast-btn learn-toast-yes" id="learn-toast-yes" title="Generuj podcast">Tak!</button>
          <button class="learn-toast-btn learn-toast-no" id="learn-toast-no" title="Nie teraz">Nie</button>
          <button class="learn-toast-btn learn-toast-stop" id="learn-toast-stop" title="Nie pokazuj wiecej w tej sesji">Nie pytaj</button>
        </div>
        <button class="learn-toast-close" id="learn-toast-close" title="Zamknij">&times;</button>
      </div>
      <div class="learn-toast-loading" id="learn-toast-loading" style="display: none;">
        <div class="learn-toast-robot" id="learn-toast-robot">(o_o)</div>
        <div class="learn-toast-loading-info">
          <p class="learn-toast-loading-text" id="learn-toast-loading-text">${LOADING_MESSAGES[0]}</p>
          <div class="learn-toast-progress"><div class="learn-toast-progress-bar" id="learn-toast-progress-bar"></div></div>
        </div>
        <button class="learn-toast-btn learn-toast-cancel" id="learn-toast-cancel">Anuluj</button>
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

function animateRobot(robotEl: HTMLElement): ReturnType<typeof setInterval> {
  let idx = 0;
  return setInterval(() => {
    idx = (idx + 1) % ROBOT_FRAMES.length;
    robotEl.textContent = ROBOT_FRAMES[idx];
  }, 500);
}

export function setOnPodcastGenerated(cb: (questionText: string, podcast: PodcastInfo) => void): void {
  onPodcastGenerated = cb;
}

export function showLearnMorePopup(question: Question, wrongCount: number): void {
  if (dismissedForSession) return;

  // Remove existing toast if any
  hideLearnMorePopup();

  const html = createToastHTML(question, wrongCount);
  document.body.insertAdjacentHTML('beforeend', html);
  toastEl = document.getElementById('learn-toast');

  // Animate in
  requestAnimationFrame(() => {
    toastEl?.classList.add('active');
  });

  // Auto-hide after 15 seconds if no interaction
  autoHideTimer = setTimeout(() => hideLearnMorePopup(), 15000);

  document.getElementById('learn-toast-yes')?.addEventListener('click', () => {
    clearAutoHide();
    handleGenerate(question);
  });
  document.getElementById('learn-toast-no')?.addEventListener('click', () => hideLearnMorePopup());
  document.getElementById('learn-toast-stop')?.addEventListener('click', () => {
    dismissedForSession = true;
    hideLearnMorePopup();
  });
  document.getElementById('learn-toast-close')?.addEventListener('click', () => hideLearnMorePopup());
}

function clearAutoHide(): void {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }
}

async function handleGenerate(question: Question): Promise<void> {
  if (isGenerating) return;
  isGenerating = true;

  const contentEl = toastEl?.querySelector('.learn-toast-content') as HTMLElement | null;
  const loadingEl = document.getElementById('learn-toast-loading');
  const loadingTextEl = document.getElementById('learn-toast-loading-text');
  const robotEl = document.getElementById('learn-toast-robot');
  const cancelBtn = document.getElementById('learn-toast-cancel');

  if (contentEl) contentEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  const messageInterval = loadingTextEl ? cycleLoadingMessages(loadingTextEl) : null;
  const robotInterval = robotEl ? animateRobot(robotEl) : null;
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
    if (robotInterval) clearInterval(robotInterval);
    onPodcastGenerated?.(question.question, result);
    hideLearnMorePopup();
    showAudioPlayer(result.audioUrl, result.title, result.script);
  } catch (err: any) {
    if (messageInterval) clearInterval(messageInterval);
    if (robotInterval) clearInterval(robotInterval);
    if (err.name === 'AbortError') return;

    // Show error briefly then hide
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) {
      contentEl.style.display = 'flex';
      contentEl.innerHTML = `
        <div class="learn-toast-icon">😔</div>
        <div class="learn-toast-text">
          <p class="learn-toast-message">Nie udalo sie wygenerowac podcastu.</p>
        </div>
        <button class="learn-toast-close" id="learn-toast-close-err">&times;</button>
      `;
      document.getElementById('learn-toast-close-err')?.addEventListener('click', () => hideLearnMorePopup());
      setTimeout(() => hideLearnMorePopup(), 5000);
    }
  } finally {
    isGenerating = false;
    abortController = null;
  }
}

export function hideLearnMorePopup(): void {
  clearAutoHide();
  if (toastEl) {
    toastEl.classList.remove('active');
    setTimeout(() => {
      toastEl?.remove();
      toastEl = null;
    }, 300);
  }
  isGenerating = false;
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
}

// Reset session dismissal (called when starting a new practice session)
export function resetLearnMoreDismissal(): void {
  dismissedForSession = false;
}
