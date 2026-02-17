# AptosRx: Decentralized Prescription Ledger

> Blockchain-backed prescription issuance and verification for doctors and pharmacies on Aptos

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Aptos](https://img.shields.io/badge/On-Aptos-0C101A?style=flat-square&logo=aptos)](https://aptos.dev/)
[![Firebase](https://img.shields.io/badge/Storage-Firebase-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)

## ▸ Overview

AptosRx lets doctors issue tamper-resistant prescriptions and pharmacies verify them. On-chain hashes ensure authenticity; Firestore stores a real-time off-chain record for fast lookups and analytics.

### ▸ Problem
- Paper or PDF prescriptions are easy to forge or modify
- Pharmacies need a fast authenticity check without heavy blockchain UX
- Doctors need a simple, wallet-friendly way to issue signed prescriptions

## ▸ Key Features

- 🔹 **Doctor Dashboard** – Create prescriptions; data is hashed (SHA-256) and recorded via Aptos
- 🔹 **Pharmacy Portal** – Verify prescriptions, scan QR codes, and mark them as used
- 🔹 **QR Code Flow** – Generate and scan QR codes to auto-fill verification details
- 🔹 **Patient Portal** – Patients can search and view prescriptions in real time
- 🔹 **Prescription History** – Search, filter, and export prescriptions with live updates
- 🔹 **Analytics Dashboard** – Real-time issuance/usage insights and trends
- 🔹 **Wallet Integration** – Petra wallet via Aptos wallet adapter
- 🔹 **Firestore Mirror** – Real-time off-chain records with status (`issued` → `used`)
- 🔹 **Simple Flows** – Minimal steps: Issue → Verify/Mark Used

## ▸ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Wouter, Tailwind CSS, shadcn/ui, React Query |
| Blockchain | Aptos Move (aptos_rx_prescription), @aptos-labs/ts-sdk, Petra wallet adapter |
| Backend | Express (middleware mode for Vite), tsx runner |
| Storage | Firebase Firestore (prescriptions collection) |
| Forms & Validation | react-hook-form, zod |
| UI | Radix primitives via shadcn/ui, lucide-react icons |

## ▸ Prerequisites
- Node.js 18+
- npm
- Petra wallet (for signing) on Aptos Testnet

## ▸ Environment
Create `.env.local` at repo root:
```
VITE_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
VITE_APTOS_CONTRACT_ADDRESS=your_deployed_contract

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Backend
PORT=5005
NODE_ENV=development
```

## ▸ Installation & Run
```bash
npm install
npm run dev -- --host   
```
## ▸ Deployment

 **Live Deployment:**  https://aptosrx.onrender.com

## ▸ Project Demo Video

**Watch the Demo:** [https://youtu.be/UaV2lS9TTdA](https://youtu.be/UaV2lS9TTdA)
## ▸ Usage
1) Connect Petra wallet (Testnet) in the app
2) Doctor: issue a prescription → on-chain hash, Firestore record (status `issued`)
3) Pharmacy: verify + mark used → on-chain call, Firestore status updates to `used`

## ▸ Smart Contract
- Module: `aptos_rx_prescription`
- Functions: `issue_prescription`, `mark_used`
- Deploy with Aptos CLI (`aptos move publish --named-addresses aptos_rx_prescription=default`)

## ▸ Firestore Data
- Collection: `prescriptions`
- Fields: `prescriptionId`, `patientId`, `drugName`, `dosage`, `notes`, `doctorAddress`, `dataHash`, `txHash`, `network`, `status` (`issued`/`used`), timestamps (`issuedAt`, `usedAt`)

## ▸ Project Structure
```
Feature-Builder
├─ client
│  ├─ public
│  └─ src
├─ server
├─ smart-contract
├─ shared
├─ script
├─ attached_assets
├─ .env.local
├─ package.json
└─ README.md
```

## ▸ Achievements
- End-to-end issuance → verification flow on Aptos Testnet
- Off-chain mirror in Firestore for fast reads and auditability
- Petra wallet integration with TypeScript-first client

## ▸ Acknowledgments
- Aptos & Petra wallet teams
- Firebase & React communities
- shadcn/ui and Radix UI contributors

<div align="center">
  <strong>AptosRx: Decentralized Prescription Ledger</strong><br>
  Made with ❤️ by Code4Care
</div>
