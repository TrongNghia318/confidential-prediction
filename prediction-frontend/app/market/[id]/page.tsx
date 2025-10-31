'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { usePredictions, Market } from '../../../hooks/usePredictions';
import { useEncrypt } from '../../../hooks/useEncrypt';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const marketId = parseInt(resolvedParams.id);
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  const {
    getMarket,
    checkHasPrediction,
    submitPrediction,
    resolveMarket,
    requestDecryption,
    getMyPrediction,
    isLoading: contractLoading,
  } = usePredictions();
  const { encryptBool, isEncrypting } = useEncrypt();

  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myPrediction, setMyPrediction] = useState<{
    prediction: boolean;
    wasCorrect: boolean;
    isResolved: boolean;
  } | null>(null);
  const [showDecrypted, setShowDecrypted] = useState(false);

  useEffect(() => {
    loadMarket();
  }, [marketId]);

  const loadMarket = async () => {
    setIsLoading(true);
    try {
      const marketData = await getMarket(marketId);
      if (!marketData) {
        router.push('/markets');
        return;
      }
      setMarket(marketData);

      if (authenticated && user?.wallet?.address) {
        const predicted = await checkHasPrediction(marketId, user.wallet.address);
        setHasPredicted(predicted);
      }
    } catch (err) {
      console.error('Failed to load market:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredict = async () => {
    if (selectedPrediction === null) {
      setError('Please select YES or NO');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const { encryptedData, proof } = await encryptBool(selectedPrediction);
      const result = await submitPrediction(marketId, encryptedData, proof);

      if (result.success) {
        setSuccess('Prediction submitted successfully!');
        setHasPredicted(true);
        setTimeout(() => {
          loadMarket();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit prediction');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit prediction');
    }
  };

  const handleResolve = async (outcome: number) => {
    if (!window.confirm(`Are you sure you want to resolve this market as ${outcome === 1 ? 'YES' : 'NO'}?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const result = await resolveMarket(marketId, outcome);

      if (result.success) {
        setSuccess('Market resolved successfully!');
        setTimeout(() => {
          loadMarket();
        }, 2000);
      } else {
        setError(result.error || 'Failed to resolve market');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve market');
    }
  };

  const handleDecryptPrediction = async () => {
    setError('');

    try {
      // First request decryption
      const decryptResult = await requestDecryption(marketId);

      if (!decryptResult.success) {
        setError(decryptResult.error || 'Failed to request decryption');
        return;
      }

      setSuccess('Decryption requested! Please wait...');

      // Wait a bit for the callback
      setTimeout(async () => {
        try {
          const prediction = await getMyPrediction(marketId);
          setMyPrediction(prediction);
          setShowDecrypted(true);
          setSuccess('');
        } catch (err: any) {
          setError('Decryption is processing, please try again in a moment');
        }
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to decrypt prediction');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!market) {
    return null;
  }

  const isActive = !market.resolved && market.outcome === 0 && Date.now() < market.deadline * 1000;
  const isCreator = authenticated && user?.wallet?.address?.toLowerCase() === market.creator.toLowerCase();
  const canResolve = isCreator && !market.resolved && Date.now() >= market.deadline * 1000;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOutcomeLabel = (outcome: number) => {
    switch (outcome) {
      case 1:
        return 'YES';
      case 2:
        return 'NO';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="text-purple-600 hover:text-purple-700 font-medium mb-6 flex items-center"
      >
        ← Back to Markets
      </button>

      {/* Market Details */}
      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {market.question}
            </h1>
            {market.description && (
              <p className="text-gray-600 mb-4">{market.description}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isActive
                ? 'bg-blue-100 text-blue-700'
                : market.resolved
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isActive ? '🟢 Active' : market.resolved ? `✓ ${getOutcomeLabel(market.outcome)}` : '⏸️ Ended'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500 mb-1">Deadline</p>
            <p className="font-medium text-gray-900">{formatDate(market.deadline)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Predictors</p>
            <p className="font-medium text-gray-900">{market.totalPredictors}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="font-medium text-gray-900">
              {market.resolved ? `Resolved: ${getOutcomeLabel(market.outcome)}` : isActive ? 'Active' : 'Ended'}
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">✅ {success}</p>
        </div>
      )}

      {/* Prediction Form */}
      {authenticated && isActive && !hasPredicted && (
        <div className="glass rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Make Your Prediction</h2>
          <p className="text-gray-600 mb-6">
            Your prediction will be encrypted and stored on-chain. Only you can decrypt it.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSelectedPrediction(true)}
              className={`p-6 rounded-xl border-2 transition ${
                selectedPrediction === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
              }`}
            >
              <div className="text-4xl mb-2">✅</div>
              <div className="font-bold text-gray-900">YES</div>
            </button>
            <button
              onClick={() => setSelectedPrediction(false)}
              className={`p-6 rounded-xl border-2 transition ${
                selectedPrediction === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              <div className="text-4xl mb-2">❌</div>
              <div className="font-bold text-gray-900">NO</div>
            </button>
          </div>

          <button
            onClick={handlePredict}
            disabled={selectedPrediction === null || isEncrypting || contractLoading}
            className="w-full gradient-purple text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isEncrypting || contractLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              'Submit Prediction'
            )}
          </button>
        </div>
      )}

      {/* Already Predicted */}
      {authenticated && hasPredicted && (
        <div className="glass rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Prediction</h2>

          {!showDecrypted ? (
            <div>
              <p className="text-gray-600 mb-4">
                You have made a prediction for this market. Click below to decrypt and view it.
              </p>
              <button
                onClick={handleDecryptPrediction}
                disabled={contractLoading}
                className="gradient-purple text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {contractLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Decrypting...</span>
                  </>
                ) : (
                  '🔓 Decrypt My Prediction'
                )}
              </button>
            </div>
          ) : myPrediction && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{myPrediction.prediction ? '✅' : '❌'}</span>
                <span className="text-xl font-bold text-gray-900">
                  You predicted: {myPrediction.prediction ? 'YES' : 'NO'}
                </span>
              </div>
              {myPrediction.isResolved && (
                <div className={`p-4 rounded-lg ${myPrediction.wasCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${myPrediction.wasCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {myPrediction.wasCorrect ? '🎉 You predicted correctly!' : '😔 Your prediction was incorrect'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resolution Panel (for creator) */}
      {canResolve && (
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Resolve Market</h2>
          <p className="text-gray-600 mb-6">
            As the creator, you can now resolve this market with the actual outcome.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleResolve(1)}
              disabled={contractLoading}
              className="gradient-green text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {contractLoading ? <LoadingSpinner size="sm" /> : '✅ Resolve as YES'}
            </button>
            <button
              onClick={() => handleResolve(2)}
              disabled={contractLoading}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {contractLoading ? <LoadingSpinner size="sm" /> : '❌ Resolve as NO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
