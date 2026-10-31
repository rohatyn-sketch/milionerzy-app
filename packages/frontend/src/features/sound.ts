import { storage } from '../state/storage';

const SFX_PATHS: Record<string, string> = {
  correct: '/assets/sounds/correct.mp3',
  incorrect: '/assets/sounds/incorrect.mp3',
  timerWarning: '/assets/sounds/timer-warning.mp3',
  achievement: '/assets/sounds/achievement.mp3',
  streak: '/assets/sounds/streak.mp3',
  click: '/assets/sounds/click.mp3',
};

// Two distinct background tracks: a calmer loop for the menus and a separate
// track for the in-game question screen. Each page loads the one it needs by
// passing a track to initSound().
export type MusicTrack = 'menu' | 'game';

const MUSIC_PATHS: Record<MusicTrack, string> = {
  menu: '/assets/sounds/background.m4a',
  game: '/assets/sounds/game.m4a',
};

const audioCache: Record<string, HTMLAudioElement> = {};
let backgroundMusic: HTMLAudioElement | null = null;
// While a podcast is playing we "duck" (silence) the background music. This is
// a hard lock: with it set, nothing — not the autoplay-on-gesture retry, not a
// stray playBackgroundMusic() call — can restart the music until the podcast
// closes. Without the lock, those paths could un-pause the track mid-podcast.
let musicDucked = false;

export function initSound(track: MusicTrack = 'menu'): void {
  Object.entries(SFX_PATHS).forEach(([key, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[key] = audio;
  });

  backgroundMusic = new Audio(MUSIC_PATHS[track]);
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.3;

  // Music is on by default (see isMusicEnabled), so it starts automatically.
  // Browsers block autoplay until the first user gesture, so the immediate
  // play() may be silently rejected; when enabled we also retry on the first
  // interaction so it starts without the user having to touch anything.
  if (isMusicEnabled()) {
    playBackgroundMusic();
    armAutoplayOnFirstGesture();
  }
}

function armAutoplayOnFirstGesture(): void {
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const start = (): void => {
    events.forEach((ev) => document.removeEventListener(ev, start));
    if (isMusicEnabled()) playBackgroundMusic();
  };
  events.forEach((ev) => document.addEventListener(ev, start));
}

export function isSfxEnabled(): boolean {
  const v = storage.getSoundSfx();
  return v === null ? true : v;
}

export function isMusicEnabled(): boolean {
  const v = storage.getSoundMusic();
  // Auto-on: music plays by default and only stays off if the user explicitly
  // turned it off (stored false).
  return v === null ? true : v;
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
  // Don't fight the podcast: while ducked, the music stays silent no matter who
  // asks it to play (see musicDucked).
  if (musicDucked) return;
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

// Duck the background music while a podcast plays: pause it (keeping position)
// and lock it silent so nothing can restart it until unduckBackgroundMusic().
export function duckBackgroundMusic(): void {
  musicDucked = true;
  if (backgroundMusic) backgroundMusic.pause();
}

// Release the duck lock and resume the music (a no-op if it was turned off).
export function unduckBackgroundMusic(): void {
  musicDucked = false;
  playBackgroundMusic();
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
