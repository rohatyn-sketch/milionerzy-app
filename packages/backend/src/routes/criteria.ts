import { Router, type IRouter } from 'express';
import { getCriteria } from '../services/question.service';

const router: IRouter = Router();

router.get('/', async (_req, res) => {
  try {
    res.json({ criteria: await getCriteria() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
