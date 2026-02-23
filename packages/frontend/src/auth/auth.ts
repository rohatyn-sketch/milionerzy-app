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

export function updateUI(): void {
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
      <button class="btn auth-login-btn" id="google-signin-btn">Zaloguj przez Google</button>
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

  // Show/hide "add class" card based on auth
  const addCards = document.querySelectorAll('.class-card-add') as NodeListOf<HTMLElement>;
  addCards.forEach((card) => {
    if (!isLoggedIn()) {
      card.style.opacity = '0.4';
      card.style.pointerEvents = 'none';
      card.title = 'Zaloguj sie, aby dodac klase';
    } else {
      card.style.opacity = '';
      card.style.pointerEvents = '';
      card.title = '';
    }
  });
}
