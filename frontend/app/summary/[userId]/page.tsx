'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, SummaryResponse } from '@/lib/api';

export default function SummaryPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.getSummary(userId)
      .then(setSummary)
      .catch((err) => setError(err.message || 'Failed to fetch summary'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded">Error: {error}</div>;
  if (!summary) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Summary for {summary.userId}</h1>
      <div className="bg-white p-6 rounded shadow space-y-3">
        <p><span className="font-medium">Total Amount:</span> {summary.totalAmount}</p>
        <p><span className="font-medium">Transaction Count:</span> {summary.transactionCount}</p>
        <p><span className="font-medium">Rank Score:</span> {summary.rankScore.toFixed(2)}</p>
        <p><span className="font-medium">Global Rank:</span> #{summary.rank}</p>
        <p><span className="font-medium">Last Transaction:</span> {summary.lastTransactionAt || 'Never'}</p>
        <p>
          <span className="font-medium">Flagged:</span>{' '}
          <span className={summary.flagged ? 'text-red-600 font-bold' : 'text-green-600'}>
            {summary.flagged ? 'Yes' : 'No'}
          </span>
        </p>
      </div>
    </div>
  );
}
