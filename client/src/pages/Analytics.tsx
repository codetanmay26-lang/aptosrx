import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, FileCheck, AlertCircle, Zap, Loader2 } from 'lucide-react';
import { truncateAddress } from '@/lib/hash';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

interface PrescriptionStats {
  totalIssued: number;
  totalVerified: number;
  totalUsed: number;
  issuedToday: number;
  verifiedToday: number;
  usedToday: number;
  successRate: number;
}

export default function Analytics() {
  const { connected, account } = useWallet();
  const [stats, setStats] = useState<PrescriptionStats>({
    totalIssued: 0,
    totalVerified: 0,
    totalUsed: 0,
    issuedToday: 0,
    verifiedToday: 0,
    usedToday: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    if (!connected || !account) {
      setLoading(false);
      return;
    }

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey) {
      setLoading(false);
      return;
    }

    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const prescriptionsRef = collection(db, 'prescriptions');

      // Real-time listener
      const unsubscribe = onSnapshot(prescriptionsRef, (snapshot) => {
        const prescriptions = snapshot.docs.map((doc) => doc.data());
        const now = Date.now();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Calculate stats
        const totalIssued = prescriptions.length;
        const totalUsed = prescriptions.filter((p) => p.status === 'used').length;
        const issuedToday = prescriptions.filter(
          (p) => new Date(p.issuedAt).setHours(0, 0, 0, 0) === today.getTime()
        ).length;
        const usedToday = prescriptions.filter(
          (p) => p.usedAt && new Date(p.usedAt).setHours(0, 0, 0, 0) === today.getTime()
        ).length;
        const successRate = totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0;

        setStats({
          totalIssued,
          totalVerified: totalIssued,
          totalUsed,
          issuedToday,
          verifiedToday: issuedToday,
          usedToday,
          successRate,
        });

        // Generate trend data from last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);

          const dayStart = date.getTime();
          const dayEnd = dayStart + 86400000;

          const issued = prescriptions.filter(
            (p) => p.issuedAt >= dayStart && p.issuedAt < dayEnd
          ).length;
          const used = prescriptions.filter(
            (p) => p.usedAt && p.usedAt >= dayStart && p.usedAt < dayEnd
          ).length;

          last7Days.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            issued,
            verified: issued,
            used,
          });
        }
        setTrendData(last7Days);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  }, [connected, account]);

  const statusData = [
    { name: 'Issued', value: stats.totalIssued - stats.totalUsed, fill: '#f59e0b' },
    { name: 'Used', value: stats.totalUsed, fill: '#10b981' },
  ];

  const networkStats = [
    { label: 'Network', value: 'Aptos Testnet' },
    { label: 'Gas Avg', value: '~0.00001 APT' },
    { label: 'Confirmation', value: '1-2 seconds' },
  ];

  if (!connected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Connect Wallet to View Analytics</h2>
          <p className="text-muted-foreground">Please connect your Petra wallet to see your prescription statistics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Analytics</h2>
          <p className="text-muted-foreground">Fetching your data from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Connected: {truncateAddress(account?.address.toString() || '')}
          </p>
        </div>
        <Badge variant="outline" className="bg-green-500/10 border-green-500/20 text-green-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
          Live
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Total Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalIssued}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.issuedToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-50/50 border-purple-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalVerified}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.verifiedToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-50/50 border-green-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.totalUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.usedToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-50/50 border-amber-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.successRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verified/Issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
            <CardDescription>Prescriptions issued, verified, and used over the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="issued" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="verified" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="used" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Prescription Status</CardTitle>
            <CardDescription>Distribution of prescription states</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Prescriptions activity breakdown by day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issued" fill="#3b82f6" />
              <Bar dataKey="verified" fill="#8b5cf6" />
              <Bar dataKey="used" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card>
        <CardHeader>
          <CardTitle>Network Information</CardTitle>
          <CardDescription>Current blockchain network details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {networkStats.map((stat, idx) => (
              <div key={idx} className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
