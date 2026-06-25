import UserStats from '../models/UserStats';

export const getRanking = async (limit: number, offset: number) => {
  const filter = { flagged: { $ne: true } };
  const totalUsers = await UserStats.countDocuments(filter);
  const users = await UserStats.find(filter)
    .sort({ rankScore: -1, transactionCount: -1, createdAt: 1 }) // tie-break
    .skip(offset)
    .limit(limit)
    .select('userId rankScore totalAmount transactionCount -_id')
    .lean();

  const ranking = users.map((u, idx) => ({
    rank: offset + idx + 1,
    userId: u.userId,
    rankScore: u.rankScore,
    totalAmount: u.totalAmount,
    transactionCount: u.transactionCount,
  }));

  return { ranking, totalUsers };
};
