import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }


  if ((err as any).code === 11000) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: 'Duplicate key error.',
      },
    });
  }


  if ((err as any).type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON in request body.',
      },
    });
  }

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};
