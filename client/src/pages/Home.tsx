import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, Building2, ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 relative">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        {/* Grid pattern */}
        <svg className="w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Gradient orbs - subtle and positioned */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/3 right-20 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl opacity-35" />
        <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-primary/4 rounded-full blur-3xl opacity-30" />
      </div>

      <section className="text-center space-y-6 py-12 relative">
        {/* Local animated gradient overlay for hero section */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/8 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute -bottom-20 right-0 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl opacity-30" style={{ animationDelay: '1s' }} />
        </div>

        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-primary">Blockchain Healthcare</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-blue-600 bg-clip-text text-transparent">
            AptosRx
          </h1>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <p className="text-xl font-medium text-foreground">
            Blockchain-Powered Prescription Verification
          </p>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Secure, transparent, and tamper-proof prescription management on the Aptos blockchain. 
            Issue prescriptions as a doctor or verify authenticity as a pharmacy.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto relative z-10">
        <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-border/40 hover:border-primary/30 bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/70 overflow-hidden relative">
          {/* Card background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl -z-10" />
          
          <CardHeader className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Doctor Dashboard</CardTitle>
            <CardDescription className="leading-relaxed text-muted-foreground">
              Issue secure, blockchain-verified prescriptions to patients with tamper-proof data integrity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/doctor">
              <Button className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30 transition-all text-white" data-testid="button-go-to-doctor">
                Go to Doctor Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-border/40 hover:border-blue-500/30 bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/70 overflow-hidden relative">
          {/* Card background accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl -z-10" />
          
          <CardHeader className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-foreground">Pharmacy Portal</CardTitle>
            <CardDescription className="leading-relaxed text-muted-foreground">
              Verify prescription authenticity and usage status instantly using blockchain verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/pharmacy">
              <Button variant="outline" className="w-full gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all text-foreground border-border/50" data-testid="button-go-to-pharmacy">
                Go to Pharmacy Portal
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Additional content removed for simplicity */}
    </div>
  );
}
