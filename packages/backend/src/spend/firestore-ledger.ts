import type { Firestore } from 'firebase-admin/firestore';
import type { LedgerDb } from './ledger';

/** Adapts firebase-admin Firestore to the ledger's minimal store interface. */
export function firestoreLedgerDb(db: Firestore): LedgerDb {
  return {
    runTransaction: (fn) =>
      db.runTransaction((tx) =>
        fn({
          get: async (path) => (await tx.get(db.doc(path))).data(),
          set: (path, data) => {
            tx.set(db.doc(path), data);
          },
        })
      ),
    get: async (path) => (await db.doc(path).get()).data(),
  };
}

let cached: LedgerDb | undefined;

/** The process-wide ledger, created lazily so tests never touch Firestore. */
export async function defaultLedgerDb(): Promise<LedgerDb> {
  if (!cached) {
    const { db } = await import('../config');
    cached = firestoreLedgerDb(db);
  }
  return cached;
}
