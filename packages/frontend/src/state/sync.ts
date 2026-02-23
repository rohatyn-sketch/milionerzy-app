import { syncProgress, isLoggedIn } from '../auth/auth';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSave(): void {
  if (!isLoggedIn()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => syncProgress(), 3000);
}
