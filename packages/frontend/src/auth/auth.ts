import { firebaseAuth } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { login as apiLogin } from '../api/auth.api';
import { loadProgress, saveProgress } from '../api/progress.api';
import { storage } from '../state/storage';
import { scheduleSave } from '../state/sync';

const googleProvider = new GoogleAuthProvider();

let currentUser: User | null = null;
let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

export function isLoggedIn(): boolean {
  return currentUser !== null;
}

export async function signIn(): Promise<void> {
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    currentUser = result.user;

    // Register with backend
    await apiLogin();

    // Load progress from server
    await restoreProgress();

    updateUI();
    console.log('[Auth] Zalogowano:', currentUser.displayName);
  } catch (err: any) {
    console.error('[Auth] Blad logowania:', err.message);
    alert('Blad logowania: ' + err.message);
  }
}

export async function logOut(): Promise<void> {
  // Save progress before logout
  if (isLoggedIn()) {
    await syncProgress();
  }

  await signOut(firebaseAuth);
  currentUser = null;

  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }

  // Revert to default class on logout
  storage.setActiveClass('default_fizyka7');

  updateUI();
  console.log('[Auth] Wylogowano');
}

export async function syncProgress(): Promise<void> {
  if (!isLoggedIn()) return;

  try {
    const data = storage.collectProgressData();
    await saveProgress(data);
  } catch (err: any) {
    console.error('[Auth] Blad zapisu progresu:', err.message);
  }
}

export async function restoreProgress(): Promise<void> {
  if (!isLoggedIn()) return;

  try {
    const data = await loadProgress();
    if (data.progress) {
      storage.restoreProgressData(data);
      console.log('[Auth] Progres zaladowany z serwera');
    }
  } catch (err: any) {
    console.error('[Auth] Blad ladowania progresu:', err.message);
  }
}

export function initAuth(): void {
  onAuthStateChanged(firebaseAuth, (user) => {
    currentUser = user;
    updateUI();

    if (user) {
      // Auto-save every 60s
      if (autoSaveInterval) clearInterval(autoSaveInterval);
      autoSaveInterval = setInterval(() => syncProgress(), 60000);
    }
  });
}

export async function updateUI(): Promise<void> {
  const loginArea = document.getElementById('auth-area');
  if (!loginArea) return;

  if (currentUser) {
    loginArea.innerHTML = `
      <div class="auth-user">
        <img src="${currentUser.photoURL || ''}" alt="" class="auth-avatar" referrerpolicy="no-referrer">
        <span class="auth-name">${currentUser.displayName || ''}</span>
        <button class="auth-logout-btn" id="logout-btn">Wyloguj</button>
      </div>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      logOut().then(() => window.location.reload());
    });
  } else {
    loginArea.innerHTML = `
      <button class="google-signin-btn" id="google-signin-btn">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Zaloguj przez Google
      </button>
      <p class="auth-hint">Zaloguj sie, aby zapisac postepy i tworzyc nowe klasy</p>
    `;
    document.getElementById('google-signin-btn')?.addEventListener('click', () => signIn());
  }

  // Show/hide generate button based on auth
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const authNotice = document.getElementById('auth-notice');
  if (generateBtn) {
    generateBtn.disabled = !isLoggedIn();
    generateBtn.title = isLoggedIn() ? '' : 'Zaloguj sie, aby generowac pytania';
  }
  if (authNotice) {
    authNotice.style.display = isLoggedIn() ? 'none' : 'block';
  }

  // Re-render class cards when auth state changes
  const { renderClassCards } = await import('../ui/class-selector');
  renderClassCards();
}
