import { Router, Request, Response, NextFunction } from 'express';
import { getRanking } from '../services/rankingService';
import { AppError } from '../utils/AppError';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let limit = parseInt(req.query.limit as string) || 20;
    let offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;
    if (offset < 0) offset = 0;

    const data = await getRanking(limit, offset);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
