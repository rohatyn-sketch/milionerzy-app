import { Timestamp } from 'firebase-admin/firestore';

export function toTimestamp(date: string | Date | null | undefined): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(typeof date === 'string' ? new Date(date) : date);
}

export function fromTimestamp(ts: Timestamp | null | undefined): string | null {
  if (!ts) return null;
  return ts.toDate().toISOString();
}

export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  for (const key of Object.keys(cleaned)) {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  }
  return cleaned;
}
