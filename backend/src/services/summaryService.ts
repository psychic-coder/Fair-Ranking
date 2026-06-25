import UserStats from '../models/UserStats';
import { AppError } from '../utils/AppError';

export const getUserSummary = async (userId: string) => {
  const stats = await UserStats.findOne({ userId }).lean();
  if (!stats) {
    throw new AppError(404, 'USER_NOT_FOUND', `User ${userId} not found`);
  }

  // Compute rank: count users with higher rankScore, then tie-break
  const rankFilter: any = {
    flagged: { $ne: true },
    $or: [
      { rankScore: { $gt: stats.rankScore } },
      {
        rankScore: stats.rankScore,
        transactionCount: { $gt: stats.transactionCount },
      },
      {
        rankScore: stats.rankScore,
        transactionCount: stats.transactionCount,
        createdAt: { $lt: stats.createdAt },
      },
    ],
  };
  const higherCount = await UserStats.countDocuments(rankFilter);
  const rank = higherCount + 1;

  return {
    userId: stats.userId,
    totalAmount: stats.totalAmount,
    transactionCount: stats.transactionCount,
    rankScore: stats.rankScore,
    rank,
    lastTransactionAt: stats.lastTransactionAt?.toISOString() ?? null,
    flagged: stats.flagged,
  };
};
