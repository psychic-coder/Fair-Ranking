import rateLimit from 'express-rate-limit';

export const transactionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // max 30 requests per minute per userId+IP
  keyGenerator: (req) => {
    // Combine userId (from body) and IP for more precise limiting
    const userId = req.body?.userId || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${userId}_${ip}`;
  },
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
