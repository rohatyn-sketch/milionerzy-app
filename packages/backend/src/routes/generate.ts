import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateAndCache } from '../services/question.service';
import { createClass } from '../services/class.service';
import { moderateTopic } from '../services/gemini.service';

const router: IRouter = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { className, context, imageBase64, mimeType, classId } = req.body;
    if (!className) { res.status(400).json({ error: 'Missing className' }); return; }

    // Only allow school-educational topics — block inappropriate/off-topic content.
    const moderation = await moderateTopic(className, context, imageBase64, mimeType);
    if (!moderation.allowed) {
      res.status(400).json({
        error: moderation.reason
          ? `Ten temat nie nadaje sie do quizu edukacyjnego: ${moderation.reason}`
          : 'Ten temat nie nadaje sie do quizu edukacyjnego. Podaj temat szkolny (np. matematyka, historia, biologia).',
      });
      return;
    }

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
