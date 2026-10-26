import { syncProgress, isLoggedIn } from '../auth/auth';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
  if (!isLoggedIn()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => syncProgress(), 3000);
}

// Returns a promise that settles when the save completes, so callers that are
// about to navigate away (e.g. leaving a game) can await it — otherwise the
// page unload cancels the request and the just-recorded progress is lost.
export function immediateSave(): Promise<void> {
  if (!isLoggedIn()) return Promise.resolve();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  return syncProgress();
}
