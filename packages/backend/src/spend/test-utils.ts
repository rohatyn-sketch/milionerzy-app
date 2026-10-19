import type { LedgerDb, LedgerTx } from './ledger';

/**
 * In-memory LedgerDb for tests. Transactions are serializable like Firestore's
 * (Firestore achieves this with optimistic retries; we use a queue), and each
 * transaction yields to the event loop between reads so concurrent callers
 * genuinely interleave.
 */
export class MemoryLedgerDb implements LedgerDb {
  docs = new Map<string, Record<string, any>>();
  failNext = 0;
  private queue: Promise<unknown> = Promise.resolve();

  async get(path: string): Promise<Record<string, any> | undefined> {
    if (this.failNext > 0) {
      this.failNext--;
      throw new Error('simulated Firestore outage');
    }
    const d = this.docs.get(path);
    return d ? structuredClone(d) : undefined;
  }

  runTransaction<T>(fn: (tx: LedgerTx) => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      if (this.failNext > 0) {
        this.failNext--;
        throw new Error('simulated Firestore outage');
      }
      const writes = new Map<string, Record<string, any>>();
      const tx: LedgerTx = {
        get: async (path) => {
          await new Promise((r) => setImmediate(r));
          const d = this.docs.get(path);
          return d ? structuredClone(d) : undefined;
        },
        set: (path, data) => {
          writes.set(path, structuredClone(data));
        },
      };
      const result = await fn(tx);
      for (const [p, d] of writes) this.docs.set(p, d);
      return result;
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }
}
