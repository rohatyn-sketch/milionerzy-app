import { Router, type IRouter } from 'express';
import { auth } from '../config';
import { createOrUpdateUser, getUser } from '../services/user.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router: IRouter = Router();

router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) { res.status(400).json({ error: 'Missing idToken' }); return; }
    const decoded = await auth.verifyIdToken(idToken);
    await createOrUpdateUser(decoded.uid, {
      googleId: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture || '',
    });
    const user = await getUser(decoded.uid);
    res.json({ user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await getUser(req.uid!);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
