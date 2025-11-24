'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { usePredictions, Market } from '../../hooks/usePredictions';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyPredictionsPage() {
  const { authenticated, user } = usePrivy();
  const { getAllMarkets, checkHasPrediction } = usePredictions();

  const [myMarkets, setMyMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      loadMyPredictions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user]);

  const loadMyPredictions = async () => {
    if (!user?.wallet?.address) return;

    setIsLoading(true);
    try {
      const allMarkets = await getAllMarkets();
      const marketsWithPredictions: Market[] = [];

      for (const market of allMarkets) {
        const hasPredicted = await checkHasPrediction(market.id, user.wallet.address);
        if (hasPredicted) {
          marketsWithPredictions.push(market);
        }
      }

      // Sort by deadline
      marketsWithPredictions.sort((a, b) => b.deadline - a.deadline);
      setMyMarkets(marketsWithPredictions);
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getOutcomeLabel = (outcome: number) => {
    switch (outcome) {
      case 0:
        return 'Pending';
      case 1:
        return 'YES';
      case 2:
        return 'NO';
      case 3:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="glass rounded-2xl p-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your wallet to view your predictions
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Predictions</h1>
        <p className="text-gray-600">View and decrypt your predictions on various markets</p>
      </div>

      {myMarkets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Predictions Yet
          </h3>
          <p className="text-gray-600 mb-6">
            You have not made any predictions yet. Browse markets and make your first prediction!
          </p>
          <Link href="/markets">
            <button className="gradient-purple text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium">
              Browse Markets
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myMarkets.map((market) => {
            const isActive =
              !market.resolved &&
              market.outcome === 0 &&
              Date.now() < market.deadline * 1000;
            const isResolved = market.resolved;

            return (
              <Link href={`/market/${market.id}`} key={market.id}>
                <div className="glass rounded-xl p-6 card-hover cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {market.question}
                        </h3>
                        {isResolved && (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              market.outcome === 1
                                ? 'bg-green-100 text-green-700'
                                : market.outcome === 2
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Resolved: {getOutcomeLabel(market.outcome)}
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Active
                          </span>
                        )}
                      </div>

                      {market.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {market.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span>📅 {formatDate(market.deadline)}</span>
                        <span>👥 {market.totalPredictors} predictor{market.totalPredictors !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button className="gradient-purple text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium text-sm">
                        View & Decrypt
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {myMarkets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {myMarkets.length}
            </div>
            <div className="text-sm text-gray-600">Total Predictions</div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {
                myMarkets.filter(
                  (m) =>
                    !m.resolved &&
                    m.outcome === 0 &&
                    Date.now() < m.deadline * 1000
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Active Markets</div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {myMarkets.filter((m) => m.resolved).length}
            </div>
            <div className="text-sm text-gray-600">Resolved Markets</div>
          </div>
        </div>
      )}
    </div>
  );
}
