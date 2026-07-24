import { Router, type IRouter } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generatePodcast, lookupPodcasts } from '../services/podcast.service';
import { isBlocked } from '../services/moderation';

const router: IRouter = Router();

router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { questionText, category, correctAnswer, explanation } = req.body;
    if (!questionText || !correctAnswer) {
      res.status(400).json({ error: 'Missing questionText or correctAnswer' });
      return;
    }

    // This text comes from the client, so it cannot be assumed to be a question
    // that already passed generation-time moderation. The local blocklist is
    // free to run and keeps arbitrary text from reaching the model.
    if (isBlocked(`${questionText} ${correctAnswer} ${explanation || ''}`)) {
      console.warn('[Podcast] Blocked by local blocklist');
      res.status(400).json({ error: 'Tresc zawiera niedozwolone slownictwo.' });
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

// Lookup which questions already have podcasts
router.post('/lookup', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { questionTexts } = req.body;
    if (!Array.isArray(questionTexts) || questionTexts.length === 0) {
      res.json({ podcasts: {} });
      return;
    }

    // Limit to 50 questions per request
    const limited = questionTexts.slice(0, 50);
    const podcasts = await lookupPodcasts(limited);
    res.json({ podcasts });
  } catch (err: any) {
    console.error('[Podcast] Lookup error:', err.message);
    res.status(500).json({ error: 'Podcast lookup failed' });
  }
});

export default router;
