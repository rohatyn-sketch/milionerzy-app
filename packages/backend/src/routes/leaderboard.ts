import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getLeaderboard, submitScore } from '../services/leaderboard.service';

const router: IRouter = Router();

router.get('/', async (_req, res) => {
  try {
    res.json({ entries: await getLeaderboard() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') {
      res.status(400).json({ error: 'Missing name or score' }); return;
    }
    await submitScore(req.uid!, name, score);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
