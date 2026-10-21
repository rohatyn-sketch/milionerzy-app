import type { Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Signs a fake Google user into the app without a real account: seeds the
// Firebase Auth record in IndexedDB and answers Firebase's account check.
// Firestore calls still fail (no backend) — only use this for UI checks.
export interface FakeUser { uid: string; displayName: string; email: string; photoURL: string | null }

export const FAKE_USER: FakeUser = { uid: 'e2e-user', displayName: 'Anna Kowalska', email: 'anna.kowalska@example.com', photoURL: null };

// The API key the build was made with (it names the stored auth record):
// .env locally, 'demo-key' when built without one (CI).
function firebaseApiKey(): string {
  if (process.env['VITE_FIREBASE_API_KEY']) return process.env['VITE_FIREBASE_API_KEY'];
  const env = resolve(__dirname, '../../.env');
  if (existsSync(env)) {
    const m = /^VITE_FIREBASE_API_KEY=(.*)$/m.exec(readFileSync(env, 'utf8'));
    if (m?.[1]) return m[1].trim();
  }
  return 'demo-key';
}

export async function signInFake(page: Page, user: FakeUser = FAKE_USER): Promise<void> {
  await page.route('https://identitytoolkit.googleapis.com/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        users: [{
          localId: user.uid, email: user.email, emailVerified: true, displayName: user.displayName,
          photoUrl: user.photoURL ?? undefined,
          providerUserInfo: [{ providerId: 'google.com', rawId: user.uid, email: user.email, displayName: user.displayName, photoUrl: user.photoURL ?? undefined }],
          lastLoginAt: '1', createdAt: '1',
        }],
      }),
    }),
  );
  await page.route('https://firestore.googleapis.com/**', (route) => route.abort());
  await page.goto('/');
  await page.evaluate(async ({ u, apiKey }) => {
    const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
    const value = {
      uid: u.uid, email: u.email, emailVerified: true, displayName: u.displayName, isAnonymous: false, photoURL: u.photoURL,
      providerData: [{ providerId: 'google.com', uid: u.uid, displayName: u.displayName, email: u.email, phoneNumber: null, photoURL: u.photoURL }],
      stsTokenManager: { refreshToken: 'fake', accessToken: 'fake', expirationTime: Date.now() + 3600_000 },
      createdAt: '1', lastLoginAt: '1', apiKey, appName: '[DEFAULT]',
    };
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('firebaseLocalStorageDb', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
      req.onsuccess = () => {
        const tx = req.result.transaction('firebaseLocalStorage', 'readwrite');
        tx.objectStore('firebaseLocalStorage').put({ fbase_key: key, value });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, { u: user, apiKey: firebaseApiKey() });
  await page.reload();
}
