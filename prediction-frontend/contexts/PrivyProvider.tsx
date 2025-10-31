'use client';

import { PrivyProvider as Privy } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';

export default function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <Privy
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#9333ea',
        },
       embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          }
        },
        defaultChain: sepolia,
        supportedChains: [sepolia],
      }}
    >
      {children}
    </Privy>
  );
}
