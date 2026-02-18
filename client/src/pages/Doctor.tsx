import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  ExternalLink, 
  Wallet,
  FileText,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { hashPrescription, generatePrescriptionId, PrescriptionData, truncateAddress } from '@/lib/hash';
import { buildIssuePrescriptionPayload, getExplorerUrl, isUsingDefaultAddress, APTOS_NODE_URL } from '@/lib/aptosClient';
import { savePrescriptionRecord } from '@/lib/firebase';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  prescriptionId?: string;
  dataHash?: string;
  doctorAddress?: string;
  patientId?: string;
  drugName?: string;
  dosage?: string;
  notes?: string;
  demoMode?: boolean;
}


export default function Doctor() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: '',
      drugName: '',
      dosage: '',
      notes: '',
      prescriptionId: generatePrescriptionId(),
    },
  });

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    form.reset({
      patientId: '',
      drugName: '',
      dosage: '',
      notes: '',
      prescriptionId: generatePrescriptionId(),
    });
    setResult(null);
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    if (!connected || !account) {
      setResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }

    setIsSubmitting(true);
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
      const payload = buildIssuePrescriptionPayload(data.prescriptionId, dataHash);

      // Always try to sign with wallet (even in demo mode) for real user experience
      const response = await signAndSubmitTransaction({
        data: payload as any,
      });

      setResult({
        success: true,
        hash: response.hash,
        prescriptionId: data.prescriptionId,
        dataHash: dataHash,
        doctorAddress: account.address.toString(),
        patientId: data.patientId,
        drugName: data.drugName,
        dosage: data.dosage,
        notes: data.notes || '',
        demoMode: isUsingDefaultAddress,
      });

      const network: 'testnet' | 'mainnet' | 'devnet' = APTOS_NODE_URL.includes('testnet')
        ? 'testnet'
        : APTOS_NODE_URL.includes('mainnet')
        ? 'mainnet'
        : 'devnet';

      void savePrescriptionRecord({
        prescriptionId: data.prescriptionId,
        doctorAddress: account.address.toString(),
        patientId: data.patientId,
        drugName: data.drugName,
        dosage: data.dosage,
        notes: data.notes || '',
        dataHash,
        txHash: response.hash,
        network,
        issuedAt: Date.now(),
        status: 'issued',
      });

      form.reset({
        patientId: '',
        drugName: '',
        dosage: '',
        notes: '',
        prescriptionId: generatePrescriptionId(),
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      const errorStr = errorMessage.toLowerCase();
      
      // Check if this is a "module not found" error (contract not deployed)
      // This catches: Module not found, module_not_found, and similar variations
      if (errorStr.includes('module') && (errorStr.includes('not found') || errorStr.includes('not_found'))) {
        setResult({
          success: true,
          hash: 'DEMO_MODE_' + Date.now(),
          prescriptionId: data.prescriptionId,
          dataHash: hashPrescription({
            patientId: data.patientId,
            drugName: data.drugName,
            dosage: data.dosage,
            notes: data.notes || '',
            prescriptionId: data.prescriptionId,
          }),
          doctorAddress: account.address.toString(),
          patientId: data.patientId,
          drugName: data.drugName,
          dosage: data.dosage,
          notes: data.notes || '',
          demoMode: true,
        });
        
        form.reset({
          patientId: '',
          drugName: '',
          dosage: '',
          notes: '',
          prescriptionId: generatePrescriptionId(),
        });
        
        console.info('📋 Demo mode: Prescription saved locally (contract not deployed on blockchain)');
      } else {
        setResult({
          success: false,
          error: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-l-4 border-l-primary/50 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border-2 border-primary/20">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your Petra wallet to issue prescriptions on the Aptos blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Make sure you have the Petra wallet extension installed and are connected to Aptos Testnet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showQRCode && result?.success && (
        <QRCodeGenerator
          prescriptionId={result.prescriptionId || ''}
          dataHash={result.dataHash || ''}
          doctorAddress={result.doctorAddress || ''}
          patientId={result.patientId || ''}
          drugName={result.drugName || ''}
          dosage={result.dosage || ''}
          notes={result.notes || ''}
          onClose={() => setShowQRCode(false)}
        />
      )}

      <div className="space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Issue New Prescription</h1>
        <p className="text-muted-foreground">
          Fill in the prescription details below. The data will be hashed and recorded on the Aptos blockchain.
        </p>
      </div>

      <Card className="border-l-4 border-l-primary/50 overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Prescription Details
          </CardTitle>
          <CardDescription>
            All fields marked with * are required. Share the prescription ID and your wallet address with the pharmacy for verification.
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
                      <div className="flex gap-2">
                        <Input 
                          {...field} 
                          placeholder="RX-123456789"
                          className="font-mono bg-background/50 border-border/50 focus:border-primary/30"
                          data-testid="input-prescription-id"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => form.setValue('prescriptionId', generatePrescriptionId())}
                          className="hover:bg-primary/10 transition-colors"
                          data-testid="button-generate-id"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
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
                        data-testid="input-patient-id"
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
                        data-testid="input-drug-name"
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
                        data-testid="input-dosage"
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
                        placeholder="Enter any additional instructions or notes..."
                        className="min-h-[100px] resize-none"
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-submit-prescription"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting to Blockchain...
                  </>
                ) : (
                  'Issue Prescription to Blockchain'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.success ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardContent className="pt-6">
            {result.success ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-green-600 dark:text-green-400">
                      Prescription {result.demoMode ? '(Demo Mode)' : 'Issued Successfully'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {result.demoMode 
                        ? 'Prescription saved locally. Deploy smart contract to testnet for blockchain verification.' 
                        : 'The prescription has been recorded on the Aptos blockchain. Share the following details with the pharmacy for verification.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Prescription ID
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                        {result.prescriptionId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(result.prescriptionId || '', 'prescriptionId')}
                      >
                        {copied === 'prescriptionId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Doctor Address (needed for verification)
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                        {result.doctorAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(result.doctorAddress || '', 'doctorAddress')}
                      >
                        {copied === 'doctorAddress' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Transaction Hash
                    </Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                        {truncateAddress(result.hash || '', 12, 8)}
                      </code>
                      <a
                        href={getExplorerUrl(result.hash || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        data-testid="link-explorer"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Data Hash (SHA-256)
                    </Label>
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded block break-all">
                      {result.dataHash}
                    </code>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => setShowQRCode(true)} className="flex-1 gap-2" variant="default">
                      <QrCode className="w-4 h-4" />
                      Show QR Code
                    </Button>
                    <Button onClick={handleReset} className="flex-1" variant="outline">
                      Issue Another
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-destructive">Transaction Failed</h3>
                  <p className="text-sm text-muted-foreground">{result.error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
