import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  idempotencyKey: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'rejected';
  createdAt: Date;
  processedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
