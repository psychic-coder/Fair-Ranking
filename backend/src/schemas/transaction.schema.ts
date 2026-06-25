import { z } from 'zod';

export const transactionSchema = z.object({
  userId: z.string().min(1).max(100),
  amount: z.number().finite().positive().max(1_000_000),
  type: z.enum(['credit', 'debit']),
  idempotencyKey: z.string().min(1),
}).strict(); // reject unknown fields
