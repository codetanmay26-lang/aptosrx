import { sha256 } from 'js-sha256';

export interface PrescriptionData {
  patientId: string;
  drugName: string;
  dosage: string;
  notes: string;
  prescriptionId: string;
}

export function hashPrescription(data: PrescriptionData): string {
  const normalizedData = {
    patientId: data.patientId.trim(),
    drugName: data.drugName.trim(),
    dosage: data.dosage.trim(),
    notes: (data.notes || '').trim(),
    prescriptionId: data.prescriptionId.trim(),
  };
  const json = JSON.stringify(normalizedData);
  const hashHex = sha256(json);
  return hashHex;
}

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function generatePrescriptionId(): string {
  return `RX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
