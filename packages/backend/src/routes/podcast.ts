import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generatePodcast } from '../services/podcast.service';

const router: IRouter = Router();

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { questionText, category, correctAnswer, explanation } = req.body;
    if (!questionText || !correctAnswer) {
      res.status(400).json({ error: 'Missing questionText or correctAnswer' });
      return;
    }

    const result = await generatePodcast(req.uid!, {
      questionText,
      category: category || '',
      correctAnswer,
      explanation,
    });

    res.json(result);
  } catch (err: any) {
    console.error('[Podcast] Generation error:', err.message);
    res.status(500).json({ error: 'Podcast generation failed' });
  }
});

export default router;
