import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { deleteClass } from '../services/class.service';

const router: IRouter = Router();

// POST (not DELETE) so it passes the GET/POST-only CORS policy.
router.post('/:classId/delete', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await deleteClass(req.uid!, req.params.classId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
