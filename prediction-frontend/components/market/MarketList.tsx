'use client';

import { useEffect, useState } from 'react';
import { usePredictions, Market } from '../../hooks/usePredictions';
import MarketCard from './MarketCard';
import LoadingSpinner from '../LoadingSpinner';

export default function MarketList() {
  const { getAllMarkets } = usePredictions();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    setIsLoading(true);
    try {
      const allMarkets = await getAllMarkets();
      // Sort by deadline, most recent first
      allMarkets.sort((a, b) => b.deadline - a.deadline);
      setMarkets(allMarkets);
    } catch (err) {
      console.error('Failed to load markets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMarkets = markets.filter((market) => {
    const now = Date.now() / 1000;
    const isActive = !market.resolved && market.outcome === 0 && now < market.deadline;

    if (filter === 'active') return isActive;
    if (filter === 'resolved') return market.resolved;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'gradient-purple text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({markets.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'active'
              ? 'gradient-purple text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Active ({markets.filter(m => !m.resolved && m.outcome === 0 && Date.now() < m.deadline * 1000).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'resolved'
              ? 'gradient-purple text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Resolved ({markets.filter(m => m.resolved).length})
        </button>
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No markets found
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Be the first to create a prediction market!'
              : `No ${filter} markets at the moment.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
