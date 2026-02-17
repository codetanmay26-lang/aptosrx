import { Link, useLocation } from 'wouter';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Menu, X, Home, Stethoscope, Building2 } from 'lucide-react';
import { truncateAddress } from '@/lib/hash';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { connected, account, connect, disconnect, wallets } = useWallet();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConnect = async () => {
    if (wallets && wallets.length > 0) {
      try {
        await connect(wallets[0].name);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/doctor', label: 'Doctor', icon: Stethoscope },
    { href: '/pharmacy', label: 'Pharmacy', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-white relative">
      {/* Subtle background elements - only visible on home page through overlays */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        {/* Subtle grid pattern */}
        <svg className="w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    Rx
                  </div>
                  <span className="text-lg font-bold text-foreground">AptosRx: Decentralized Prescription Ledger</span>
                </div>
              </Link>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 bg-green-500/10 border-green-500/20 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Aptos Testnet
              </Badge>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className="gap-2"
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {connected && account ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-mono text-muted-foreground">
                      {truncateAddress(account.address.toString())}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="gap-2"
                    data-testid="button-disconnect-wallet"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="gap-2"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {children}
      </main>

      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>AptosRx: Decentralized Prescription Ledger</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Connected to Aptos Testnet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
