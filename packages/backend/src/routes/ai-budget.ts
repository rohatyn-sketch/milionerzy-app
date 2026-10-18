import { Router, type IRouter } from 'express';
import type { AiBudgetResponse } from '@milionerzy/shared';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { defaultLedgerDb } from '../spend/firestore-ledger';
import { exposureUsd, readBudget } from '../spend/ledger';

const router: IRouter = Router();

/**
 * The signed-in user's own AI budget for the current period. Deliberately does
 * not reveal app-wide dollar figures — only whether AI is currently available.
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const view = await readBudget(await defaultLedgerDb(), req.uid!);
    const spent = exposureUsd(view.user!);
    const cap = view.config.userCapUsd;
    const body: AiBudgetResponse = {
      aiAvailable: view.config.aiEnabled && exposureUsd(view.global) < view.config.globalCapUsd && spent < cap,
      period: view.periodKey,
      resetsAt: view.resetsAt,
      user: {
        spentUsd: Math.round(spent * 100) / 100,
        capUsd: cap,
        remainingUsd: Math.max(0, Math.round((cap - spent) * 100) / 100),
      },
    };
    res.json(body);
  } catch (err: any) {
    console.error('[Spend] budget read failed:', err?.message);
    res.status(503).json({ error: 'Budget unavailable' });
  }
});

export default router;
