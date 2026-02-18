import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface QRCodeGeneratorProps {
  prescriptionId: string;
  dataHash: string;
  doctorAddress: string;
  patientId: string;
  drugName: string;
  dosage: string;
  notes?: string;
  onClose?: () => void;
}

export function QRCodeGenerator({ prescriptionId, dataHash, doctorAddress, patientId, drugName, dosage, notes, onClose }: QRCodeGeneratorProps) {
  const qrData = JSON.stringify({
    prescriptionId,
    dataHash,
    doctorAddress,
    patientId,
    drugName,
    dosage,
    notes: notes || '',
    timestamp: new Date().toISOString(),
  });

  const downloadQR = () => {
    const svgElement = document.querySelector('#qr-code-canvas') as SVGSVGElement;
    if (svgElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `prescription-${prescriptionId}-qr.png`;
        link.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Prescription QR Code</h3>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
          <div id="qr-code-container">
            <QRCodeSVG
              id="qr-code-canvas"
              value={qrData}
              size={384}
              level="L"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Prescription ID:</strong> {prescriptionId}</p>
          <p><strong>Patient ID:</strong> {patientId}</p>
          <p><strong>Medication:</strong> {drugName} - {dosage}</p>
          <p><strong>Doctor:</strong> {doctorAddress.slice(0, 10)}...{doctorAddress.slice(-4)}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={downloadQR} className="flex-1 gap-2" variant="default">
            <Download className="w-4 h-4" />
            Download QR
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1" variant="outline">
              Close
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Pharmacies can scan this QR code to quickly verify the prescription
        </p>
      </div>
    </div>
  );
}
