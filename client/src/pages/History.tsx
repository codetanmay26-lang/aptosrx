import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { truncateAddress } from '@/lib/hash';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

interface PrescriptionRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  drugName: string;
  dosage: string;
  doctorAddress: string;
  status: 'issued' | 'used';
  issuedAt: number;
  usedAt?: number;
  notes: string;
  dataHash: string;
}

export default function PrescriptionHistory() {
  const { connected, account } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'medication'>('date-desc');
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Real-time listener for all prescriptions
      const unsubscribe = onSnapshot(prescriptionsRef, (snapshot) => {
        const data: PrescriptionRecord[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            prescriptionId: docData.prescriptionId || '',
            patientId: docData.patientId || '',
            drugName: docData.drugName || '',
            dosage: docData.dosage || '',
            doctorAddress: docData.doctorAddress || '',
            status: docData.status || 'issued',
            issuedAt: docData.issuedAt || Date.now(),
            usedAt: docData.usedAt,
            notes: docData.notes || '',
            dataHash: docData.dataHash || '',
          });
        });
        setPrescriptions(data);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setLoading(false);
    }
  }, [connected, account]);

  const filteredAndSorted = prescriptions
    .filter((rx) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          rx.prescriptionId.toLowerCase().includes(term) ||
          rx.drugName.toLowerCase().includes(term) ||
          rx.patientId.toLowerCase().includes(term) ||
          rx.doctorAddress.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .filter((rx) => statusFilter === 'all' || rx.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.issuedAt - a.issuedAt;
        case 'date-asc':
          return a.issuedAt - b.issuedAt;
        case 'medication':
          return a.drugName.localeCompare(b.drugName);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'used':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'issued':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'used':
        return <CheckCircle className="w-4 h-4" />;
      case 'issued':
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadHistory = () => {
    let csv = 'Prescription ID,Patient ID,Medication,Dosage,Doctor,Status,Issued Date,Notes\n';
    filteredAndSorted.forEach((rx) => {
      csv += `${rx.prescriptionId},${rx.patientId},${rx.drugName},${rx.dosage},${rx.doctorAddress},${rx.status},${formatDate(rx.issuedAt)},"${rx.notes}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!connected) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Connect Wallet to View History</h2>
          <p className="text-muted-foreground">Please connect your Petra wallet to see prescription history.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading Prescriptions</h2>
          <p className="text-muted-foreground">Fetching your prescription data from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Prescription History</h1>
        <p className="text-muted-foreground mt-1">
          Search, filter, and manage all prescriptions
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, medication, patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="medication">Medication A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{filteredAndSorted.length}</span> prescription{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={downloadHistory} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No Prescriptions Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSorted.map((rx) => (
            <Card key={rx.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {rx.drugName} - {rx.dosage}
                      </h3>
                      <Badge className={`flex items-center gap-1 ${getStatusColor(rx.status)}`}>
                        {getStatusIcon(rx.status)}
                        {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-medium">ID:</span> {rx.prescriptionId}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-muted-foreground">
                        <div>
                          <span className="font-medium">Patient:</span> {rx.patientId}
                        </div>
                        <div>
                          <span className="font-medium">Doctor:</span> {truncateAddress(rx.doctorAddress)}
                        </div>
                        <div>
                          <span className="font-medium">Issued:</span> {formatDate(rx.issuedAt)}
                        </div>
                        {rx.usedAt && (
                          <div>
                            <span className="font-medium">Used:</span> {formatDate(rx.usedAt)}
                          </div>
                        )}
                      </div>

                      {rx.notes && (
                        <div className="text-muted-foreground italic">
                          "{rx.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:flex-col">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {filteredAndSorted.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                <p className="text-2xl font-bold text-foreground">{filteredAndSorted.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Used</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAndSorted.filter((r) => r.status === 'used').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {filteredAndSorted.filter((r) => r.status === 'issued').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
