'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { api, RankingEntry } from '@/lib/api';

const fetcher = ([limit, offset]: [number, number]) => api.getRanking(limit, offset);

export default function RankingPage() {
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Use SWR for data fetching, caching, and revalidation
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [limit, offset],
    fetcher,
    { keepPreviousData: true }
  );

  const totalPages = data ? Math.ceil(data.totalUsers / limit) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Global Ranking</h1>
        <button
          onClick={() => mutate()}
          className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded">Error: {error.message || 'Failed to load ranking'}</div>}
      
      <div className="overflow-x-auto bg-white rounded shadow relative min-h-[300px]">
        {(isLoading || isValidating) && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 transition-opacity duration-200 backdrop-blur-[1px]">
            <span className="text-gray-600 font-medium">Refreshing...</span>
          </div>
        )}
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Rank</th>
              <th className="p-2 text-left">User ID</th>
              <th className="p-2 text-right">Rank Score</th>
              <th className="p-2 text-right">Total Amount</th>
              <th className="p-2 text-right">Tx Count</th>
            </tr>
          </thead>
          <tbody>
            {data?.ranking.map((entry: RankingEntry) => (
              <tr key={entry.userId} className="border-t hover:bg-gray-50 transition-colors">
                <td className="p-2 font-medium text-gray-700">{entry.rank}</td>
                <td className="p-2">
                  <Link href={`/summary/${entry.userId}`} className="text-blue-600 hover:underline">
                    {entry.userId}
                  </Link>
                </td>
                <td className="p-2 text-right text-blue-600 font-semibold">{entry.rankScore.toFixed(2)}</td>
                <td className="p-2 text-right">{entry.totalAmount.toFixed(2)}</td>
                <td className="p-2 text-right">{entry.transactionCount}</td>
              </tr>
            ))}
            {data?.ranking.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalUsers > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{offset + 1}</span> to <span className="font-medium">{Math.min(offset + limit, data.totalUsers)}</span> of <span className="font-medium">{data.totalUsers}</span> results
          </div>
          
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, i, arr) => {
                const isGap = i > 0 && p - arr[i - 1] > 1;
                return (
                  <div key={p} className="flex gap-1 items-center">
                    {isGap && <span className="px-2 py-1 text-gray-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 border rounded transition-colors ${
                        page === p 
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}
              
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
