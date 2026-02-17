import { useState, useRef } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (data: { prescriptionId: string; doctorAddress: string; dataHash: string; patientId: string; drugName: string; dosage: string; notes: string }) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const qrData = JSON.parse(code.data);
            if (qrData.prescriptionId && qrData.doctorAddress && qrData.dataHash && qrData.patientId && qrData.drugName && qrData.dosage) {
              onScanSuccess(qrData);
              onClose();
            } else {
              setError('Invalid QR code format - missing required fields');
            }
          } catch {
            setError('Failed to parse QR code');
          }
        } else {
          setError('No QR code found in image');
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

        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Upload className="w-10 h-10 text-primary/60 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">Click to upload QR code image</p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full" variant="outline">
          Close
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Upload a screenshot of the prescription QR code to scan
        </p>
      </div>
    </div>
  );
}
