import express from 'express';
import cors from 'cors';
import transactionRoutes from './routes/transaction.routes';
import summaryRoutes from './routes/summary.routes';
import rankingRoutes from './routes/ranking.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// CORS – allow frontend origin
app.use(cors());

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/transaction', transactionRoutes);
app.use('/summary', summaryRoutes);
app.use('/ranking', rankingRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Central error handler
app.use(errorHandler);

export default app;
