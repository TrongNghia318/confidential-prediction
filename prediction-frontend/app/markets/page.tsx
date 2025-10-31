'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import MarketList from '../../components/market/MarketList';

export default function MarketsPage() {
  const { authenticated } = usePrivy();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Prediction Markets
          </h1>
          <p className="text-gray-600">
            Browse active and resolved prediction markets
          </p>
        </div>
        {authenticated && (
          <Link href="/create">
            <button className="gradient-purple text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium">
              Create Market
            </button>
          </Link>
        )}
      </div>

      <MarketList />
    </div>
  );
}
