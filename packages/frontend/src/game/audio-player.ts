import { t } from '../features/i18n';
import { openDialog, setupDialog, closeDialog } from '../ui/dialog';
import { pauseBackgroundMusic, playBackgroundMusic } from '../features/sound';

let playerEl: HTMLElement | null = null;
let audioEl: HTMLAudioElement | null = null;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function createPlayerHTML(title: string): string {
  return `
    <div class="audio-player-overlay" id="audio-player-overlay">
      <div class="audio-player-box" role="dialog" aria-modal="true" aria-labelledby="audio-player-title">
        <div class="audio-player-header">
          <span class="audio-player-icon" aria-hidden="true">🎧</span>
          <h2 class="audio-player-title" id="audio-player-title">${title}</h2>
        </div>
        <div class="audio-player-controls">
          <button type="button" class="audio-player-btn" id="audio-play-btn" title="${t('audio.playPause', 'Odtwarzaj/Pauza')}" aria-label="${t('audio.playPause', 'Odtwarzaj/Pauza')}">▶</button>
          <div class="audio-player-progress-wrap">
            <input type="range" class="audio-player-progress" id="audio-progress" aria-label="${t('audio.position', 'Pozycja odtwarzania')}" min="0" max="100" value="0" step="0.1">
            <div class="audio-player-time">
              <span id="audio-current-time">0:00</span> / <span id="audio-duration">0:00</span>
            </div>
          </div>
          <select class="audio-player-speed" id="audio-speed" title="${t('audio.speed', 'Predkosc odtwarzania')}" aria-label="${t('audio.speed', 'Predkosc odtwarzania')}">
            <option value="0.75">0.75x</option>
            <option value="1" selected>1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>
        </div>
        <div class="audio-player-transcript-toggle">
          <button class="btn btn-secondary audio-player-transcript-btn" id="audio-transcript-btn">${t('audio.showTranscript', 'Pokaz transkrypt')}</button>
        </div>
        <div class="audio-player-transcript" id="audio-transcript" style="display: none;"></div>
        <button class="btn btn-primary audio-player-close" id="audio-player-close">${t('audio.back', 'Wroc do cwiczen')}</button>
      </div>
    </div>
  `;
}

export function showAudioPlayer(audioUrl: string, title: string, transcript?: string): void {
  hideAudioPlayer();

  // Duck the background music so it doesn't talk over the podcast; it resumes
  // when the player closes (hideAudioPlayer).
  pauseBackgroundMusic();

  document.body.insertAdjacentHTML('beforeend', createPlayerHTML(title));
  playerEl = document.getElementById('audio-player-overlay');

  audioEl = new Audio(audioUrl);
  audioEl.preload = 'auto';

  const playBtn = document.getElementById('audio-play-btn')!;
  const progressEl = document.getElementById('audio-progress') as HTMLInputElement;
  const currentTimeEl = document.getElementById('audio-current-time')!;
  const durationEl = document.getElementById('audio-duration')!;
  const speedEl = document.getElementById('audio-speed') as HTMLSelectElement;
  const closeBtn = document.getElementById('audio-player-close')!;
  const transcriptBtn = document.getElementById('audio-transcript-btn')!;
  const transcriptEl = document.getElementById('audio-transcript')!;

  // Play/pause
  playBtn.addEventListener('click', () => {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play();
      playBtn.textContent = '⏸';
    } else {
      audioEl.pause();
      playBtn.textContent = '▶';
    }
  });

  // Duration loaded
  audioEl.addEventListener('loadedmetadata', () => {
    if (!audioEl) return;
    durationEl.textContent = formatTime(audioEl.duration);
    progressEl.max = audioEl.duration.toString();
  });

  // Time update
  audioEl.addEventListener('timeupdate', () => {
    if (!audioEl) return;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
    progressEl.value = audioEl.currentTime.toString();
  });

  // Seek
  progressEl.addEventListener('input', () => {
    if (!audioEl) return;
    audioEl.currentTime = parseFloat(progressEl.value);
  });

  // Speed
  speedEl.addEventListener('change', () => {
    if (!audioEl) return;
    audioEl.playbackRate = parseFloat(speedEl.value);
  });

  // Ended
  audioEl.addEventListener('ended', () => {
    playBtn.textContent = '▶';
  });

  // Transcript
  if (transcript) {
    transcriptEl.textContent = transcript;
    transcriptBtn.addEventListener('click', () => {
      const isHidden = transcriptEl.style.display === 'none';
      transcriptEl.style.display = isHidden ? 'block' : 'none';
      transcriptBtn.textContent = isHidden ? t('audio.hideTranscript', 'Ukryj transkrypt') : t('audio.showTranscript', 'Pokaz transkrypt');
    });
  } else {
    transcriptBtn.style.display = 'none';
  }

  // Close button, Esc, focus trap and focus return: ui/dialog.ts.
  const overlay = playerEl!;
  setupDialog(overlay, closeBtn, document.createElement('div'));
  openDialog(overlay, { initialFocus: playBtn, onClose: () => hideAudioPlayer() });

  // Auto-play
  audioEl.play().then(() => {
    playBtn.textContent = '⏸';
  }).catch(() => {
    // Autoplay blocked by browser, user must click play
  });
}

export function hideAudioPlayer(): void {
  if (audioEl) {
    audioEl.pause();
    audioEl.src = '';
    audioEl = null;
  }
  if (playerEl) {
    const el = playerEl;
    closeDialog(el);
    el.classList.remove('active');
    playerEl = null;
    setTimeout(() => el.remove(), 300);
    // Resume the background music the podcast was ducking (no-op if music off).
    playBackgroundMusic();
  }
}
