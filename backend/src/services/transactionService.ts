import { v4 as uuidv4 } from 'uuid';
import Transaction from '../models/Transaction';
import UserStats from '../models/UserStats';
import User from '../models/User';
import { checkVelocity } from './abuseService';
import {
  TRANSACTION_WEIGHT,
  CAP_TRANSACTION_COUNT,
  MAX_CONSISTENCY_DAYS,
  RANKING_WEIGHTS,
} from '../config/ranking';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

interface CreateTransactionInput {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  idempotencyKey: string;
}

export const processTransaction = async (input: CreateTransactionInput) => {
  const { userId, amount, type, idempotencyKey } = input;

  // Ensure user exists (auto-create)
  await User.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, createdAt: new Date() } },
    { upsert: true, new: true }
  );

  const transactionId = uuidv4();

  let transaction;
  try {
    transaction = await Transaction.create({
      transactionId,
      idempotencyKey,
      userId,
      amount,
      type,
      status: 'pending',
    });
  } catch (err: any) {
    // Duplicate key error (E11000) on idempotencyKey
    if (err.code === 11000 && err.keyPattern?.idempotencyKey) {
      const existing = await Transaction.findOne({ idempotencyKey });
      if (existing) {
        return existing.toObject();
      }
    }
    throw err;
  }

  // Run velocity abuse check
  const isFlagged = await checkVelocity(userId);

  // Date string for activeDays
  const today = new Date().toISOString().slice(0, 10);

  // Atomic pipeline update of UserStats
  const pipeline = [
    {
      $set: {
        totalAmount: { $add: [{ $ifNull: ['$totalAmount', 0] }, amount] },
        transactionCount: { $add: [{ $ifNull: ['$transactionCount', 0] }, 1] },
        lastTransactionAt: new Date(),
        flagged: {
          $cond: {
            if: { $eq: ['$$setFlagged', true] },
            then: true,
            else: '$flagged',
          },
        },
        activeDays: {
          $cond: {
            if: { $isArray: ['$activeDays'] },
            then: { $setUnion: ['$activeDays', [today]] },
            else: [today],
          },
        },
      },
    },
    {
      $set: {
        rankScore: {
          $add: [
            { $multiply: [{ $ifNull: ['$totalAmount', 0] }, RANKING_WEIGHTS.TOTAL_AMOUNT] },
            {
              $multiply: [
                { $min: [{ $ifNull: ['$transactionCount', 0] }, CAP_TRANSACTION_COUNT] },
                TRANSACTION_WEIGHT,
                RANKING_WEIGHTS.CAPPED_TRANSACTION_COUNT,
              ],
            },
            {
              $multiply: [
                { $min: [{ $size: { $ifNull: ['$activeDays', []] } }, MAX_CONSISTENCY_DAYS] },
                RANKING_WEIGHTS.CONSISTENCY_BONUS,
              ],
            },
          ],
        },
      },
    },
  ];

  await UserStats.updateOne(
    { userId },
    pipeline,
    {
      upsert: true,
      let: { setFlagged: isFlagged },
    }
  );

  // Mark transaction completed
  transaction.status = 'completed';
  transaction.processedAt = new Date();
  await transaction.save();

  return transaction.toObject();
};
