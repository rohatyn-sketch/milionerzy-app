import { storage } from '../state/storage';

const SOUND_PATHS: Record<string, string> = {
  correct: '/assets/sounds/correct.mp3',
  incorrect: '/assets/sounds/incorrect.mp3',
  timerWarning: '/assets/sounds/timer-warning.mp3',
  achievement: '/assets/sounds/achievement.mp3',
  streak: '/assets/sounds/streak.mp3',
  click: '/assets/sounds/click.mp3',
  background: '/assets/sounds/background.mp3',
};

const audioCache: Record<string, HTMLAudioElement> = {};
let backgroundMusic: HTMLAudioElement | null = null;

export function initSound(): void {
  Object.entries(SOUND_PATHS).forEach(([key, path]) => {
    if (key !== 'background') {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache[key] = audio;
    }
  });
  backgroundMusic = new Audio(SOUND_PATHS.background);
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3;
}

export function isSfxEnabled(): boolean {
  const v = storage.getSoundSfx();
  return v === null ? true : v;
}

export function isMusicEnabled(): boolean {
  const v = storage.getSoundMusic();
  return v === null ? false : v;
}

function play(name: string): void {
  if (!isSfxEnabled()) return;
  const audio = audioCache[name];
  if (audio) {
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = 0.5;
    clone.play().catch(() => {});
  }
}

export function playCorrect(): void { play('correct'); }
export function playIncorrect(): void { play('incorrect'); }
export function playTimerWarning(): void { play('timerWarning'); }
export function playAchievement(): void { play('achievement'); }
export function playStreak(): void { play('streak'); }
export function playClick(): void { play('click'); }

export function playBackgroundMusic(): void {
  if (backgroundMusic && isMusicEnabled()) {
    backgroundMusic.play().catch(() => {});
  }
}

export function stopBackgroundMusic(): void {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
}

export function toggleSfx(): boolean {
  const enabled = !isSfxEnabled();
  storage.setSoundSfx(enabled);
  return enabled;
}

export function toggleMusic(): boolean {
  const enabled = !isMusicEnabled();
  storage.setSoundMusic(enabled);
  if (enabled) playBackgroundMusic();
  else stopBackgroundMusic();
  return enabled;
}
