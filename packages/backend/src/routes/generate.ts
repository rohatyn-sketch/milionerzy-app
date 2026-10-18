import { Router, type IRouter, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateAndCache, getCachedQuestions } from '../services/question.service';
import { createClass } from '../services/class.service';
import { moderateTopic } from '../services/gemini.service';
import { isAiRefused } from '../spend/errors';
import { checkAiRateLimit } from '../spend/rate-limit';

const router: IRouter = Router();

/**
 * Moderates the topic and generates fresh questions. Returns null after
 * writing a 4xx/5xx response when the topic is refused.
 */
async function moderateAndGenerate(
  req: AuthRequest,
  res: Response,
  className: string,
  context?: string,
  imageBase64?: string,
  mimeType?: string
): Promise<any[] | null> {
  // Cheap abuse guard before any paid call.
  checkAiRateLimit(req.uid!);

  // Only allow school-educational topics — block inappropriate/off-topic content.
  const moderation = await moderateTopic(req.uid!, className, context, imageBase64, mimeType);
  if (!moderation.allowed) {
    // A topic we could not check is refused, but it is not the user's fault —
    // report it as a temporary failure instead of accusing them of a bad topic.
    if (moderation.source === 'unavailable') {
      res.status(503).json({
        error: 'Weryfikacja tematu jest chwilowo niedostepna. Sprobuj ponownie za chwile.',
      });
      return null;
    }

    res.status(400).json({
      error: moderation.reason
        ? `Ten temat nie nadaje sie do quizu edukacyjnego: ${moderation.reason}`
        : 'Ten temat nie nadaje sie do quizu edukacyjnego. Podaj temat szkolny (np. matematyka, historia, biologia).',
    });
    return null;
  }

  return generateAndCache(req.uid!, className, context, imageBase64, mimeType);
}

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { className, context, imageBase64, mimeType, classId } = req.body;
    if (!className) { res.status(400).json({ error: 'Missing className' }); return; }

    // A cached topic was moderated when it was first generated (the cache key
    // is className + context), so it is served without spending on moderation
    // again. This also keeps cached topics working once the AI budget is spent.
    const questions =
      (await getCachedQuestions(className, context)) ??
      (await moderateAndGenerate(req, res, className, context, imageBase64, mimeType));
    if (!questions) return;

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
    if (isAiRefused(err)) {
      res.status(err.status).json(err.toResponse());
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
