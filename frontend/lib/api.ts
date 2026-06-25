const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface TransactionPayload {
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  idempotencyKey: string;
}

export interface TransactionResponse {
  transactionId: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export interface SummaryResponse {
  userId: string;
  totalAmount: number;
  transactionCount: number;
  rankScore: number;
  rank: number;
  lastTransactionAt: string | null;
  flagged: boolean;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  rankScore: number;
  totalAmount: number;
  transactionCount: number;
}

export interface RankingResponse {
  ranking: RankingEntry[];
  totalUsers: number;
}

class ApiError extends Error {
  code: string;
  status: number;
  details?: any;
  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const error = body?.error || {};
    throw new ApiError(
      res.status,
      error.code || 'UNKNOWN',
      error.message || 'Request failed',
      error.details
    );
  }
  return res.json();
}

export const api = {
  submitTransaction: async (payload: TransactionPayload): Promise<TransactionResponse> => {
    const res = await fetch(`${BASE_URL}/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  getSummary: async (userId: string): Promise<SummaryResponse> => {
    const res = await fetch(`${BASE_URL}/summary/${encodeURIComponent(userId)}`);
    return handleResponse(res);
  },

  getRanking: async (limit = 20, offset = 0): Promise<RankingResponse> => {
    const res = await fetch(
      `${BASE_URL}/ranking?limit=${limit}&offset=${offset}`
    );
    return handleResponse(res);
  },
};
