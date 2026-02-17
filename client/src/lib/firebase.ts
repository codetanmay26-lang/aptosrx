import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function isConfigComplete() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

function getDb() {
  if (!isConfigComplete()) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export type PrescriptionRecord = {
  prescriptionId: string;
  doctorAddress: string;
  patientId: string;
  drugName: string;
  dosage: string;
  notes: string;
  dataHash: string;
  txHash: string;
  network: 'testnet' | 'mainnet' | 'devnet';
  issuedAt: number;
  status: 'issued' | 'used';
};

export async function savePrescriptionRecord(record: PrescriptionRecord) {
  const db = getDb();
  if (!db) return;
  const ref = doc(db, 'prescriptions', record.prescriptionId);
  await setDoc(ref, record);
}

export async function markPrescriptionUsed(prescriptionId: string) {
  const db = getDb();
  if (!db) return;
  const ref = doc(db, 'prescriptions', prescriptionId);
  await updateDoc(ref, { status: 'used' });
}
