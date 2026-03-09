import express from 'express';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import generateRoutes from './routes/generate';
import criteriaRoutes from './routes/criteria';
import leaderboardRoutes from './routes/leaderboard';

const app = express();

app.use(express.json({ limit: '10mb' }));

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check for Cloud Run
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user/progress', progressRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use(errorHandler);

const port = parseInt(process.env.PORT || '8080', 10);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
