'use client';

import { useState } from 'react';
import { api, TransactionPayload } from '@/lib/api';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateKey = () => {
    setIdempotencyKey(crypto.randomUUID());
  };

  const resetForm = () => {
    setUserId('');
    setAmount('');
    setType('credit');
    setIdempotencyKey('');
    setResponse(null);
    setError(null);
  };

  const submitTransaction = async (dup = false) => {
    if (!userId || !amount || !idempotencyKey) {
      setError('All fields are required');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1_000_000) {
      setError('Amount must be > 0 and ≤ 1,000,000');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload: TransactionPayload = {
        userId,
        amount: numAmount,
        type,
        idempotencyKey,
      };
      const data = await api.submitTransaction(payload);
      setResponse(data);
      // If not duplicate, generate new key for next fresh transaction (but keep displayed)
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Submit Transaction</h1>
      <div className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block mb-1 font-medium">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="e.g. user123"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="0.00"
            min="0.01"
            max="1000000"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'credit' | 'debit')}
            className="border p-2 w-full rounded"
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Idempotency Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={idempotencyKey}
              readOnly
              className="border p-2 flex-1 rounded bg-gray-100"
              placeholder="Generate a key..."
            />
            <button
              onClick={generateKey}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => submitTransaction(false)}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={() => submitTransaction(true)}
            disabled={loading || !idempotencyKey}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Submit Duplicate
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded">
          <h2 className="font-bold mb-2">Response</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
