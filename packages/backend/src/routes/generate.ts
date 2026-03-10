import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateAndCache } from '../services/question.service';
import { createClass } from '../services/class.service';

const router: IRouter = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { className, context, imageBase64, mimeType, classId } = req.body;
    if (!className) { res.status(400).json({ error: 'Missing className' }); return; }
    const questions = await generateAndCache(req.uid!, className, context, imageBase64, mimeType);

    // Save class to user's subcollection if classId provided
    if (classId) {
      await createClass(req.uid!, classId, {
        name: className,
        isDefault: false,
        questionCount: questions.length,
        context,
        generatedAt: new Date().toISOString(),
        questions,
      });
    }

    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
