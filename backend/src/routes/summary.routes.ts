import { Router, Request, Response, NextFunction } from 'express';
import { getUserSummary } from '../services/summaryService';

const router = Router();

router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getUserSummary(req.params.userId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
