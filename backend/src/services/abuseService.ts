import Transaction from '../models/Transaction';
import { ABUSE_VELOCITY_WINDOW_MINUTES, ABUSE_VELOCITY_MAX_TRANSACTIONS } from '../config/ranking';

export const checkVelocity = async (userId: string): Promise<boolean> => {
  const windowStart = new Date(Date.now() - ABUSE_VELOCITY_WINDOW_MINUTES * 60 * 1000);
  const count = await Transaction.countDocuments({
    userId,
    status: 'completed',
    createdAt: { $gte: windowStart },
  });
  return count >= ABUSE_VELOCITY_MAX_TRANSACTIONS;
};
