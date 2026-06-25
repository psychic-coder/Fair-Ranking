import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStats extends Document {
  userId: string;
  totalAmount: number;
  transactionCount: number;
  lastTransactionAt: Date | null;
  flagged: boolean;
  rankScore: number;
  activeDays: string[];
  createdAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
  userId: { type: String, required: true, unique: true },
  totalAmount: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
  lastTransactionAt: { type: Date, default: null },
  flagged: { type: Boolean, default: false },
  rankScore: { type: Number, default: 0 },
  activeDays: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for optimal ranking query:
UserStatsSchema.index({ flagged: 1, rankScore: -1, transactionCount: -1, createdAt: 1 });

export default mongoose.model<IUserStats>('UserStats', UserStatsSchema);
