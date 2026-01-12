# Payflow Technical Readout

**Prepared for:** Payflow CTO  
**Date:** January 2026  
**Subject:** Merchant Deposit Address & USDC Sweep PoC

---

## Problem Summary

### Customer Challenge

Payflow needs to provide merchants with on-demand deposit addresses while maintaining strict control over fund movements. Key requirements:

1. **Merchant Onboarding**: Merchants need deposit addresses instantly without complex setup
2. **Fund Security**: Deposited funds should only flow to Payflow's omnibus wallet—no other destinations
3. **Asset Control**: Only approved assets (USDC) should be transferable; other tokens must be locked
4. **Operational Simplicity**: Automated sweeping across all merchant addresses without manual intervention

### Goals

| Goal | Success Criteria |
|------|------------------|
| Instant deposit addresses | Merchants receive an address in < 2 seconds |
| Policy enforcement | Non-USDC transfers are rejected at signing |
| Destination lockdown | Only omnibus wallet can receive funds |
| Scalable sweeping | Scan and sweep all merchant addresses in one operation |

---

## Solution Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Turnkey Organization                           │
│                         (Payflow)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Merchant   │    │  Merchant   │    │  Merchant   │    ...      │
│  │  Wallet A   │    │  Wallet B   │    │  Wallet C   │             │
│  │  ┌───────┐  │    │  ┌───────┐  │    │  ┌───────┐  │             │
│  │  │ Addr  │  │    │  │ Addr  │  │    │  │ Addr  │  │             │
│  │  │ 0x123 │  │    │  │ 0x456 │  │    │  │ 0x789 │  │             │
│  │  └───┬───┘  │    │  └───┬───┘  │    │  └───┬───┘  │             │
│  └──────┼──────┘    └──────┼──────┘    └──────┼──────┘             │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │  USDC ONLY      │  ◄── Policy Enforced          │
│                   │  (via Policy)   │                               │
│                   └────────┬────────┘                               │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │    Omnibus      │                               │
│                   │    Wallet       │                               │
│                   │    0x995...     │                               │
│                   └─────────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Implementation |
|-----------|----------------|
| **Merchant Wallets** | Turnkey HD wallets with Ethereum accounts |
| **Deposit Addresses** | Derived wallet accounts (BIP32 path) |
| **Transfer Policy** | `EFFECT_ALLOW` only for USDC → Omnibus |
| **Sweep Operation** | List wallets → List accounts → Check balances → Sign & broadcast |

### Policy Configuration

Two policies enforce the security model:

**1. Allow USDC Transfers to Omnibus Only**
```json
{
  "effect": "EFFECT_ALLOW",
  "condition": "eth.tx.to == '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' && eth.tx.data[0..10] == '0xa9059cbb' && eth.tx.data[34..74] == '99534f20e524954147373ff3a1a0a38ff7442662'"
}
```

| Condition | Purpose |
|-----------|---------|
| `eth.tx.to == '0x1c7d...'` | Transaction must be to USDC contract |
| `eth.tx.data[0..10] == '0xa9059cbb'` | Must call `transfer` function |
| `eth.tx.data[34..74] == '99534f20...'` | Recipient must be omnibus wallet |

**2. Allow Merchant Wallet Creation**
```json
{
  "effect": "EFFECT_ALLOW", 
  "condition": "activity.type == 'ACTIVITY_TYPE_CREATE_WALLET' || activity.type == 'ACTIVITY_TYPE_CREATE_WALLET_ACCOUNTS'"
}
```

All other actions → **Implicit Deny**

### Transaction Flow

```
1. Merchant requests deposit address
   └─► createWallet() → Returns wallet ID + address

2. Customer deposits USDC to merchant address
   └─► On-chain transfer (external)

3. Payflow initiates sweep
   ├─► getWallets() → List all merchant wallets
   ├─► getWalletAccounts() → Get all addresses per wallet
   ├─► Check USDC balance for each address
   ├─► Build unsigned ERC-20 transfer tx
   ├─► signTransaction() → Turnkey signs (policy checked here)
   └─► Broadcast to network

4. Policy enforcement (at signing time)
   ├─► USDC to Omnibus     ✅ ALLOWED
   ├─► WETH to Omnibus     ❌ DENIED (wrong token)
   ├─► USDC to burn addr   ❌ DENIED (wrong destination)
   └─► Native ETH transfer ❌ DENIED (not USDC contract)
```

---

## Demo Walkthrough

> 🎥 **Video Demo:** [Loom Recording](#) *(link to be added)*

### Demo Script

The demonstration covers the following scenarios:

1. **Create Merchant Wallet**
   - Generate a new merchant wallet on-demand
   - Display wallet ID (UUID) and deposit address

2. **Sweep All Wallets**
   - Scan all wallets in the organization
   - Check USDC balances across all addresses
   - Execute sweep to omnibus wallet

3. **Policy Enforcement Tests**
   - Attempt to transfer WETH to omnibus → **Denied** (wrong token)
   - Attempt to transfer USDC to burn address → **Denied** (wrong destination)
   - Transfer USDC to omnibus → **Allowed**

### Running the Demo

```bash
cd examples/payflow-example
pnpm install
pnpm start
```

Menu options:
```
? What would you like to do?
❯ Sweep all wallets
  Create a new merchant wallet  
  Sweep a single address
  Test policy denial (WETH to omnibus)
  Test policy denial (USDC to wrong address)
```

---

## Next Steps

| Item | Description | Priority |
|------|-------------|----------|
| Sub-organizations | Isolate merchants into sub-orgs for enhanced security | High |
| Webhook integration | Trigger sweeps on deposit events | Medium |
| Multi-token support | Extend policies for additional stablecoins | Medium |
| Gas optimization | Batch transactions or use gas station | Low |

---

*For technical details, see the full [README.md](../README.md)*

