# AptosRx Smart Contract

## Overview

This Move smart contract provides blockchain-based prescription management on the Aptos network.

## Features

- **issue_prescription**: Doctors can issue prescriptions with a unique ID and data hash
- **verify_prescription**: Pharmacies can verify prescription authenticity and usage status
- **mark_used**: Doctors can mark prescriptions as dispensed to prevent reuse

## Setup Instructions

### 1. Install Aptos CLI

```bash
# macOS
brew install aptos

# Linux/Windows (via script)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### 2. Initialize Move Project

```bash
cd smart-contract
aptos init --network testnet
```

This creates a `.aptos` folder with your account configuration.

### 3. Get Testnet Tokens

```bash
aptos account fund-with-faucet --account default --amount 100000000
```

### 4. Update Move.toml

Replace `aptos_rx = "_"` with your account address:

```toml
[addresses]
aptos_rx = "0xYOUR_ACCOUNT_ADDRESS"
```

### 5. Compile the Contract

```bash
aptos move compile
```

### 6. Deploy to Testnet

```bash
aptos move publish --named-addresses aptos_rx=default
```

### 7. Configure Frontend

Add your contract address to the frontend environment:

```bash
# In .env or Vercel environment variables
VITE_APTOS_CONTRACT_ADDRESS=0xYOUR_ACCOUNT_ADDRESS
```

## Contract Functions

### issue_prescription

```move
public entry fun issue_prescription(
    doctor: &signer,
    prescription_id: u64,
    data_hash: vector<u8>
)
```

Issues a new prescription. Only callable by the signing doctor.

### verify_prescription

```move
#[view]
public fun verify_prescription(
    doctor_addr: address,
    prescription_id: u64,
    data_hash: vector<u8>
): bool
```

Verifies a prescription. Returns `true` if:
- Prescription exists
- Hash matches
- Prescription hasn't been used

### mark_used

```move
public entry fun mark_used(
    doctor: &signer,
    prescription_id: u64
)
```

Marks a prescription as dispensed. Only callable by the original issuing doctor.

## Error Codes

- `E_PRESCRIPTION_EXISTS (1)`: Prescription ID already exists
- `E_PRESCRIPTION_NOT_FOUND (2)`: Prescription not found
- `E_NOT_AUTHORIZED (3)`: Caller not authorized
- `E_ALREADY_USED (4)`: Prescription already used

## Testing

```bash
aptos move test
```

## Security Considerations

- Only the prescription data hash is stored on-chain (not the actual data)
- Only doctors can issue and mark prescriptions as used
- Each prescription can only be marked as used once
- All transactions are signed and verified on the Aptos blockchain
