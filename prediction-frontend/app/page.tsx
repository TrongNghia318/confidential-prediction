'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

export default function Home() {
  const { authenticated } = usePrivy();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-block mb-4">
          <span className="text-6xl">🔮</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Confidential Prediction Market
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Make predictions on binary outcomes with complete privacy.
          Your predictions are encrypted on-chain using FHEVM technology.
        </p>
        {authenticated && (
          <Link href="/create">
            <button className="gradient-purple text-white px-8 py-3 rounded-lg hover:opacity-90 transition font-medium text-lg shadow-lg">
              Create Market
            </button>
          </Link>
        )}
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="glass rounded-2xl p-8 card-hover">
          <div className="text-5xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Fully Private
          </h3>
          <p className="text-gray-600">
            Your predictions are encrypted using FHEVM. Only you can decrypt and see what you predicted.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 card-hover">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            On-Chain Security
          </h3>
          <p className="text-gray-600">
            All predictions are stored on-chain with cryptographic guarantees. No centralized servers.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 card-hover">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Binary Outcomes
          </h3>
          <p className="text-gray-600">
            Simple Yes/No questions with clear outcomes. Check if you predicted correctly after resolution.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="glass rounded-2xl p-10 mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 gradient-purple rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Create or Find</h4>
            <p className="text-gray-600 text-sm">
              Create a prediction market or find one you're interested in
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 gradient-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Make Prediction</h4>
            <p className="text-gray-600 text-sm">
              Submit your encrypted Yes/No prediction before the deadline
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 gradient-green rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Wait for Resolution</h4>
            <p className="text-gray-600 text-sm">
              Creator resolves the market with the actual outcome after deadline
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Check Result</h4>
            <p className="text-gray-600 text-sm">
              Decrypt your prediction to see if you were correct!
            </p>
          </div>
        </div>
      </div>

      {/* Markets Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Prediction Markets
          </h2>
          <Link href="/markets">
            <button className="text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </button>
          </Link>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 text-center border border-purple-100">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Start Predicting
          </h3>
          <p className="text-gray-600 mb-6">
            Browse markets and make your encrypted predictions, or create your own market
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/markets">
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg hover:bg-gray-50 transition font-medium border border-purple-200">
                Browse Markets
              </button>
            </Link>
            {authenticated && (
              <Link href="/create">
                <button className="gradient-purple text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium">
                  Create Market
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
