import {
  AptosWalletAdapterProvider,
  type AvailableWallets,
} from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';

const optInWallets: AvailableWallets[] = ['Petra'];

export function WalletProvider({ children }: PropsWithChildren) {
  return (
      <AptosWalletAdapterProvider
        optInWallets={optInWallets}
        autoConnect={true}
        onError={(error) => {
          console.error('Wallet connection error:', error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
  );
}
