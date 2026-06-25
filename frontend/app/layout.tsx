import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Fair Ranking System',
  description: 'MVP for transaction ranking with fairness',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white shadow p-4 flex gap-6">
          <a href="/" className="font-semibold hover:text-blue-600">Submit</a>
          <a href="/ranking" className="hover:text-blue-600">Ranking</a>
        </nav>
        <main className="max-w-2xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
