'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { usePredictions } from '../../hooks/usePredictions';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CreateMarket() {
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { createMarket, isLoading } = usePredictions();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(7); // days
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    if (duration < 1) {
      setError('Duration must be at least 1 day');
      return;
    }

    try {
      const result = await createMarket(question, description, duration);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/markets');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create market');
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
            Please connect your wallet to create a prediction market
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Create Prediction Market
        </h1>
        <p className="text-gray-600">
          Create a binary (Yes/No) prediction market for others to participate in
        </p>
      </div>

      <div className="glass rounded-2xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will Bitcoin reach $100k by end of 2025?"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              maxLength={200}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {question.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context or criteria for resolution..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              maxLength={1000}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Duration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min={1}
              max={365}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Market will close after {duration} day{duration !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">📋 Before you create:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Question should have a clear Yes/No answer</li>
              <li>• You will be responsible for resolving this market</li>
              <li>• Resolution should be based on objective criteria</li>
              <li>• Duration cannot be changed after creation</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Market created successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full gradient-purple text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating Market...</span>
              </>
            ) : (
              'Create Market'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
