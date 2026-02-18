import { useState, useRef } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { X, Upload, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (data: { prescriptionId: string; doctorAddress: string; dataHash: string; patientId: string; drugName: string; dosage: string; notes: string }) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError('Failed to read the image file');
      setLoading(false);
    };
    
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        setError('Failed to load the image. Make sure it\'s a valid image file.');
        setLoading(false);
      };
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Canvas context not available');
            setLoading(false);
            return;
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to detect QR code
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code?.data) {
            try {
              const qrData = JSON.parse(code.data);
              
              // Validate all required fields are present
              if (qrData.prescriptionId && qrData.doctorAddress && qrData.patientId && qrData.drugName && qrData.dosage) {
                onScanSuccess({
                  prescriptionId: qrData.prescriptionId,
                  doctorAddress: qrData.doctorAddress,
                  dataHash: qrData.dataHash || '',
                  patientId: qrData.patientId,
                  drugName: qrData.drugName,
                  dosage: qrData.dosage,
                  notes: qrData.notes || ''
                });
                setLoading(false);
                onClose();
                return;
              } else {
                const missing = [];
                if (!qrData.prescriptionId) missing.push('Prescription ID');
                if (!qrData.doctorAddress) missing.push('Doctor Address');
                if (!qrData.patientId) missing.push('Patient ID');
                if (!qrData.drugName) missing.push('Drug Name');
                if (!qrData.dosage) missing.push('Dosage');
                setError(`QR code missing fields: ${missing.join(', ')}`);
              }
            } catch (parseError) {
              setError('QR code data is not in the expected format. Make sure you\'re scanning a prescription QR code.');
              console.error('Parse error:', parseError);
            }
          } else {
            setError('No QR code detected. Try a clearer image or screenshot.');
          }
          setLoading(false);
        } catch (error) {
          console.error('QR scan error:', error);
          setError('An error occurred while scanning the QR code.');
          setLoading(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Scan Prescription QR Code</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Upload a clear screenshot or photo of the prescription QR code. All prescription details will be auto-filled.
        </p>

        <div className="space-y-4">
          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-10 h-10 text-primary/60 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              {loading ? 'Scanning...' : 'Click to upload QR code image'}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full" variant="outline">
          Close
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          The QR code contains all prescription details and will auto-fill the verification form.
        </p>
      </div>
    </div>
  );
}
