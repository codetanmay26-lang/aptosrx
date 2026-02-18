import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search,
  Shield,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { hashPrescription, PrescriptionData, truncateAddress } from '@/lib/hash';
import { verifyPrescription, isUsingDefaultAddress, buildMarkUsedPayload } from '@/lib/aptosClient';
import { markPrescriptionUsed } from '@/lib/firebase';
import { QRScanner } from '@/components/QRScanner';

const verifySchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  doctorAddress: z.string().min(1, 'Doctor address is required').regex(/^0x[a-fA-F0-9]+$/, 'Invalid Aptos address format'),
  patientId: z.string().min(1, 'Patient ID is required'),
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
});

type VerifyFormData = z.infer<typeof verifySchema>;

interface VerificationResult {
  verified: boolean;
  checked: boolean;
  prescriptionId?: string;
  doctorAddress?: string;
  dataHash?: string;
  demoMode?: boolean;
  markedUsed?: boolean;
}

export default function Pharmacy() {
  const { signAndSubmitTransaction, connected, account } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      prescriptionId: '',
      doctorAddress: '',
      patientId: '',
      drugName: '',
      dosage: '',
      notes: '',
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    setIsVerifying(true);
    setResult(null);

    try {
      const prescriptionData: PrescriptionData = {
        patientId: data.patientId,
        drugName: data.drugName,
        dosage: data.dosage,
        notes: data.notes || '',
        prescriptionId: data.prescriptionId,
      };

      const dataHash = hashPrescription(prescriptionData);

      // If contract is not deployed, skip blockchain verification and go straight to demo mode
      if (isUsingDefaultAddress) {
        console.info('⏭️ Skipping blockchain verification - contract not deployed, using demo mode');
        setResult({
          verified: true,
          checked: true,
          prescriptionId: data.prescriptionId,
          doctorAddress: data.doctorAddress,
          dataHash: dataHash,
          demoMode: true,
        });
        return;
      }

      const isValid = await verifyPrescription(data.doctorAddress, data.prescriptionId, dataHash);

      setResult({
        verified: isValid,
        checked: true,
        prescriptionId: data.prescriptionId,
        doctorAddress: data.doctorAddress,
        dataHash: dataHash,
        demoMode: isValid && import.meta.env.VITE_APTOS_CONTRACT_ADDRESS === '0x1',
        markedUsed: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Verification error:', error);
      
      // Check if contract not deployed - treat as demo mode verification
      if (errorMessage.toLowerCase().includes('module') && errorMessage.toLowerCase().includes('not found')) {
        setResult({
          verified: true,
          checked: true,
          prescriptionId: data.prescriptionId,
          doctorAddress: data.doctorAddress,
          demoMode: true,
          markedUsed: false,
        });
      } else {
        setResult({
          verified: false,
          checked: true,
          prescriptionId: data.prescriptionId,
          doctorAddress: data.doctorAddress,
          markedUsed: false,
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setResult(null);
  };

  const handleQRScan = (qrData: { prescriptionId: string; doctorAddress: string; dataHash: string; patientId: string; drugName: string; dosage: string; notes: string }) => {
    form.setValue('prescriptionId', qrData.prescriptionId);
    form.setValue('doctorAddress', qrData.doctorAddress);
    form.setValue('patientId', qrData.patientId);
    form.setValue('drugName', qrData.drugName);
    form.setValue('dosage', qrData.dosage);
    form.setValue('notes', qrData.notes);
    setShowQRScanner(false);
  };

  const handleMarkUsed = async () => {
    if (!result?.verified || !result.prescriptionId || !connected || !account) return;

    try {
      setIsMarking(true);
      const payload = buildMarkUsedPayload(result.prescriptionId);
      const response = await signAndSubmitTransaction({ data: payload as any });

      setResult((prev) => prev ? { ...prev, markedUsed: true } : prev);
      void markPrescriptionUsed(result.prescriptionId);
      console.info('✅ Marked as used. Tx:', response.hash);
    } catch (error) {
      console.error('Error marking used:', error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      <div className="space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">Verify Prescription</h1>
        <p className="text-muted-foreground">
          Enter the prescription details and doctor's wallet address to verify authenticity against the blockchain record.
        </p>
      </div>

      <Button 
        onClick={() => setShowQRScanner(true)}
        className="w-full gap-2"
        variant="outline"
        size="lg"
        data-testid="button-scan-qr"
      >
        <QrCode className="w-5 h-5" />
        Scan QR Code
      </Button>

      <Card className="border-l-4 border-l-blue-500/50 overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            Prescription Verification
          </CardTitle>
          <CardDescription>
            Enter the exact details as provided by the patient, including the doctor's wallet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prescriptionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescription ID *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter prescription ID (e.g., RX-123456789)"
                        className="font-mono"
                        data-testid="input-verify-prescription-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="doctorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor's Wallet Address *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="0x..."
                        className="font-mono"
                        data-testid="input-verify-doctor-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient ID *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter patient identifier"
                        data-testid="input-verify-patient-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="drugName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter medication name"
                        data-testid="input-verify-drug-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., 500mg twice daily"
                        data-testid="input-verify-dosage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter any additional notes from the prescription..."
                        className="min-h-[100px] resize-none"
                        data-testid="input-verify-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isVerifying}
                  data-testid="button-verify-prescription"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify on Blockchain
                    </>
                  )}
                </Button>
                {result && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleReset}
                    data-testid="button-reset-form"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && result.checked && (
        <Card className={result.verified ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardContent className="pt-6">
            {result.verified ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {result.demoMode ? 'Demo Mode: Valid Format' : 'Authentic & Unused'}
                  </h3>
                  <p className="text-muted-foreground">
                    {result.demoMode 
                      ? 'Prescription data is valid. Deploy smart contract for blockchain verification.'
                      : 'This prescription is valid and has not been used before.'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Prescription ID:</span>
                    <span className="font-mono">{result.prescriptionId}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Doctor Address:</span>
                    <span className="font-mono">{truncateAddress(result.doctorAddress || '', 10, 6)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="block">Data Hash:</span>
                    <code className="font-mono break-all">{result.dataHash}</code>
                  </div>
                  {!result.demoMode && (
                    <div className="flex justify-center pt-2">
                      <Button 
                        variant={result.markedUsed ? 'secondary' : 'default'}
                        onClick={handleMarkUsed}
                        disabled={isMarking || result.markedUsed}
                      >
                        {result.markedUsed ? 'Marked as Used' : isMarking ? 'Marking...' : 'Mark as Used'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-destructive">
                    Invalid or Already Used
                  </h3>
                  <p className="text-muted-foreground">
                    This prescription could not be verified. It may be invalid, tampered with, or already used.
                  </p>
                </div>
                <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-4 text-left">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Possible reasons:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Prescription was never issued on the blockchain</li>
                      <li>Details do not match the original prescription exactly</li>
                      <li>Prescription has already been marked as used</li>
                      <li>Doctor address or prescription ID is incorrect</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
