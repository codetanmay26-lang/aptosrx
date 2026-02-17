/// AptosRx Prescription Module
/// 
/// This module provides blockchain-based prescription management with:
/// - issue_prescription: Create a new prescription record on-chain
/// - verify_prescription: Check if a prescription is valid and unused
/// - mark_used: Mark a prescription as dispensed
module aptos_rx::aptos_rx_prescription {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::table::{Self, Table};

    /// Error codes
    const E_PRESCRIPTION_EXISTS: u64 = 1;
    const E_PRESCRIPTION_NOT_FOUND: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_ALREADY_USED: u64 = 4;

    /// Prescription data structure
    struct Prescription has store, copy, drop {
        id: u64,
        doctor: address,
        data_hash: vector<u8>,
        timestamp: u64,
        is_used: bool,
    }

    /// Global prescription storage
    struct PrescriptionStore has key {
        prescriptions: Table<u64, Prescription>,
    }

    /// Initialize the prescription store for a doctor
    fun init_store(account: &signer) {
        if (!exists<PrescriptionStore>(signer::address_of(account))) {
            move_to(account, PrescriptionStore {
                prescriptions: table::new(),
            });
        }
    }

    /// Issue a new prescription
    /// @param doctor - The signing doctor
    /// @param prescription_id - Unique prescription identifier
    /// @param data_hash - SHA-256 hash of prescription data
    public entry fun issue_prescription(
        doctor: &signer,
        prescription_id: u64,
        data_hash: vector<u8>
    ) acquires PrescriptionStore {
        let doctor_addr = signer::address_of(doctor);
        
        // Initialize store if not exists
        if (!exists<PrescriptionStore>(doctor_addr)) {
            init_store(doctor);
        };
        
        let store = borrow_global_mut<PrescriptionStore>(doctor_addr);
        
        // Check if prescription already exists
        assert!(!table::contains(&store.prescriptions, prescription_id), E_PRESCRIPTION_EXISTS);
        
        // Create new prescription
        let prescription = Prescription {
            id: prescription_id,
            doctor: doctor_addr,
            data_hash,
            timestamp: timestamp::now_seconds(),
            is_used: false,
        };
        
        // Store the prescription
        table::add(&mut store.prescriptions, prescription_id, prescription);
    }

    /// Verify a prescription against its hash
    /// @param doctor_addr - Address of the issuing doctor
    /// @param prescription_id - The prescription ID to verify
    /// @param data_hash - The hash to verify against
    /// @return bool - true if valid and unused, false otherwise
    #[view]
    public fun verify_prescription(
        doctor_addr: address,
        prescription_id: u64,
        data_hash: vector<u8>
    ): bool acquires PrescriptionStore {
        // Check if store exists
        if (!exists<PrescriptionStore>(doctor_addr)) {
            return false
        };
        
        let store = borrow_global<PrescriptionStore>(doctor_addr);
        
        // Check if prescription exists
        if (!table::contains(&store.prescriptions, prescription_id)) {
            return false
        };
        
        let prescription = table::borrow(&store.prescriptions, prescription_id);
        
        // Verify hash matches and prescription is not used
        prescription.data_hash == data_hash && !prescription.is_used
    }

    /// Mark a prescription as used (dispensed)
    /// @param doctor - The signing doctor (must be original issuer)
    /// @param prescription_id - The prescription to mark as used
    public entry fun mark_used(
        doctor: &signer,
        prescription_id: u64
    ) acquires PrescriptionStore {
        let doctor_addr = signer::address_of(doctor);
        
        assert!(exists<PrescriptionStore>(doctor_addr), E_PRESCRIPTION_NOT_FOUND);
        
        let store = borrow_global_mut<PrescriptionStore>(doctor_addr);
        
        assert!(table::contains(&store.prescriptions, prescription_id), E_PRESCRIPTION_NOT_FOUND);
        
        let prescription = table::borrow_mut(&mut store.prescriptions, prescription_id);
        
        assert!(!prescription.is_used, E_ALREADY_USED);
        
        prescription.is_used = true;
    }

    /// Get prescription details (view function)
    #[view]
    public fun get_prescription(
        doctor_addr: address,
        prescription_id: u64
    ): (u64, address, vector<u8>, u64, bool) acquires PrescriptionStore {
        assert!(exists<PrescriptionStore>(doctor_addr), E_PRESCRIPTION_NOT_FOUND);
        
        let store = borrow_global<PrescriptionStore>(doctor_addr);
        
        assert!(table::contains(&store.prescriptions, prescription_id), E_PRESCRIPTION_NOT_FOUND);
        
        let prescription = table::borrow(&store.prescriptions, prescription_id);
        
        (
            prescription.id,
            prescription.doctor,
            prescription.data_hash,
            prescription.timestamp,
            prescription.is_used
        )
    }
}
