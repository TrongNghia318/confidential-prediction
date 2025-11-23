import type { Metadata } from 'next';
import './globals.css';
import PrivyProvider from '../contexts/PrivyProvider';
import { FhevmProvider } from '../contexts/FhevmContext';
import Navigation from '../components/Navigation';
import NetworkGuard from '../components/NetworkGuard';

export const metadata: Metadata = {
  title: 'Confidential Prediction Market',
  description: 'Make encrypted predictions on binary outcomes using ZAMA FHEVM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider>
          <FhevmProvider>
            <NetworkGuard />
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">
                {children}
              </main>
              <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <p className="text-center text-gray-600 text-sm">
                    Powered by{' '}
                    <a
                      href="https://www.zama.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Zama FHEVM
                    </a>
                    {' '}- Confidential predictions on-chain
                  </p>
                </div>
              </footer>
            </div>
          </FhevmProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
