import Link from 'next/link';
import { Market } from '../../hooks/usePredictions';

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
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

  const getOutcomeColor = (outcome: number) => {
    switch (outcome) {
      case 0:
        return 'bg-gray-100 text-gray-700';
      case 1:
        return 'bg-green-100 text-green-700';
      case 2:
        return 'bg-red-100 text-red-700';
      case 3:
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isActive = !market.resolved && market.outcome === 0 && Date.now() < market.deadline * 1000;
  const deadlinePassed = Date.now() >= market.deadline * 1000;

  const formatDeadline = () => {
    const date = new Date(market.deadline * 1000);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) {
      return 'Ended';
    } else if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h left`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}m left`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Link href={`/market/${market.id}`}>
      <div className="glass rounded-xl p-6 card-hover cursor-pointer h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
              {market.question}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {market.description || 'No description provided'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : market.resolved
                  ? getOutcomeColor(market.outcome)
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {isActive ? '🟢 Active' : market.resolved ? `✓ ${getOutcomeLabel(market.outcome)}` : '⏸️ Pending'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDeadline()}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-1">👥</span>
                <span>{market.totalPredictors} predictor{market.totalPredictors !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              by {formatAddress(market.creator)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
