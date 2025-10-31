'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

export default function Navigation() {
  const { authenticated, login, logout, user } = usePrivy();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔮</span>
            <span className="text-xl font-bold text-gray-900">
              Confidential Predictions
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/markets"
              className="text-gray-600 hover:text-purple-600 font-medium transition"
            >
              Markets
            </Link>
            {authenticated && (
              <>
                <Link
                  href="/create"
                  className="text-gray-600 hover:text-purple-600 font-medium transition"
                >
                  Create
                </Link>
                <Link
                  href="/my-predictions"
                  className="text-gray-600 hover:text-purple-600 font-medium transition"
                >
                  My Predictions
                </Link>
              </>
            )}

            {/* Auth Button */}
            {authenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {user?.wallet?.address && formatAddress(user.wallet.address)}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="gradient-purple text-white px-6 py-2 rounded-lg hover:opacity-90 transition font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
