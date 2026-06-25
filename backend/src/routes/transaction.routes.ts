import { Router, Request, Response, NextFunction } from 'express';
import { transactionSchema } from '../schemas/transaction.schema';
import { processTransaction } from '../services/transactionService';
import { transactionRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

const router = Router();

router.post(
  '/',
  transactionRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = transactionSchema.parse(req.body);
      const result = await processTransaction(parsed);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details,
          },
        });
      }
      next(err);
    }
  }
);

export default router;
