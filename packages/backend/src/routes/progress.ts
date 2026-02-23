import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getProgress, saveProgress } from '../services/progress.service';

const router: IRouter = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    res.json(await getProgress(req.uid!));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await saveProgress(req.uid!, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
