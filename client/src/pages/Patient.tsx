import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Loader2, 
  Download, 
  Calendar, 
  User,
  Pill,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { truncateAddress } from '@/lib/hash';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const searchSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface Prescription {
  prescriptionId: string;
  patientId: string;
  drugName: string;
  dosage: string;
  doctorAddress: string;
  status: 'issued' | 'used';
  issuedAt: number;
  usedAt?: number;
  notes: string;
}

export default function PatientDashboard() {
  const [isSearching, setIsSearching] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searched, setSearched] = useState(false);
  const [activePatientId, setActivePatientId] = useState('');

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      patientId: '',
    },
  });

  const onSubmit = async (data: SearchFormData) => {
    setPrescriptions([]);
    setSearched(false);
    setActivePatientId(data.patientId.trim());
  };

  useEffect(() => {
    if (!activePatientId) return;

    setIsSearching(true);

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.apiKey) {
      setIsSearching(false);
      setSearched(true);
      return;
    }

    try {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);
      const prescriptionsRef = collection(db, 'prescriptions');
      const q = query(prescriptionsRef, where('patientId', '==', activePatientId));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data: Prescription[] = [];
          snapshot.forEach((doc) => {
            const docData = doc.data();
            data.push({
              prescriptionId: docData.prescriptionId || doc.id,
              patientId: docData.patientId || activePatientId,
              drugName: docData.drugName || '',
              dosage: docData.dosage || '',
              doctorAddress: docData.doctorAddress || '',
              status: docData.status || 'issued',
              issuedAt: docData.issuedAt || Date.now(),
              usedAt: docData.usedAt,
              notes: docData.notes || '',
            });
          });
          data.sort((a, b) => b.issuedAt - a.issuedAt);
          setPrescriptions(data);
          setIsSearching(false);
          setSearched(true);
        },
        (error) => {
          console.error('Search failed:', error);
          setIsSearching(false);
          setSearched(true);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Search failed:', error);
      setIsSearching(false);
      setSearched(true);
    }
  }, [activePatientId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'used':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Used</Badge>;
      case 'issued':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20"><FileText className="w-3 h-3 mr-1" /> Issued</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadPrescription = (rx: Prescription) => {
    const content = `
PRESCRIPTION RECORD
==================
Prescription ID: ${rx.prescriptionId}
Patient ID: ${rx.patientId}
Medication: ${rx.drugName}
Dosage: ${rx.dosage}
Doctor Address: ${rx.doctorAddress}
Status: ${rx.status}
Issued: ${formatDate(rx.issuedAt)}
${rx.usedAt ? `Used: ${formatDate(rx.usedAt)}` : ''}
Notes: ${rx.notes}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${rx.prescriptionId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Prescriptions</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your prescription records
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Prescriptions</CardTitle>
          <CardDescription>
            Enter your patient ID to view all your prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter your patient ID"
                        disabled={isSearching}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search Prescriptions
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && prescriptions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No Prescriptions Found</h3>
              <p className="text-muted-foreground">
                Try searching with a different patient ID
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      {prescriptions.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Found {prescriptions.length} Prescription{prescriptions.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <Card key={rx.prescriptionId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {rx.drugName}
                          </h3>
                          {getStatusBadge(rx.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ID: {rx.prescriptionId}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPrescription(rx)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          Dosage
                        </p>
                        <p className="text-sm font-medium text-foreground">{rx.dosage}</p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Doctor
                        </p>
                        <p className="text-sm font-medium text-foreground font-mono break-all" title={rx.doctorAddress}>
                          {truncateAddress(rx.doctorAddress, 12)}
                        </p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Issued
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(rx.issuedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {rx.usedAt && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Used
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(rx.usedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {rx.notes && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          <span className="font-semibold">Notes:</span> {rx.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50/50 border-blue-200/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            About Your Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>
            • Your prescriptions are securely stored on the Aptos blockchain
          </p>
          <p>
            • You can download prescriptions for your records
          </p>
          <p>
            • Status changes are tracked in real-time
          </p>
          <p>
            • Share prescription IDs and doctor address with pharmacies to verify
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
