# Encryption Key Escrow

This example demonstrates the **encryption key escrow pattern** for high-performance, multi-wallet signing scenarios. This pattern enables applications to:

- Store encrypted wallet bundles persistently (client-side or in your infrastructure)
- Retrieve a per-session decryption key from Turnkey with a single API call
- Perform zero-latency local signing during active sessions
- Maintain security through key separation (encrypted bundles + Turnkey-held decryption key)

## Use Cases

This pattern is ideal for applications that need:

| Requirement | Solution |
|-------------|----------|
| Ultra-fast signing | Keys decrypted locally; signing requires zero network calls |
| Multi-wallet operations | Decrypt 10, 100, or 1000+ wallets with a single key export |
| Persistent wallet access | Encrypted bundles stored in localStorage, database, or cloud storage |
| Session-based security | Decryption key only present during active user sessions |
| Scalable architecture | Performance independent of wallet count after initial session start |

**Example scenarios:**
- Trading applications with many wallets per user
- Batch transaction signing
- Gaming applications with multiple in-game wallets
- Portfolio management across many addresses

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ENCRYPTED WALLET STORE                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │ Wallet  │ │ Wallet  │ │ Wallet  │ │   ...   │        │    │
│  │  │ Bundle  │ │ Bundle  │ │ Bundle  │ │         │        │    │
│  │  │ (enc)   │ │ (enc)   │ │ (enc)   │ │ (enc)   │        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  │  Persisted in localStorage, IndexedDB, or your servers   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              │ Per-session decryption            │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ACTIVE SESSION (in memory)                  │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │ Wallet  │ │ Wallet  │ │ Wallet  │ │   ...   │        │    │
│  │  │ (plain) │ │ (plain) │ │ (plain) │ │ (plain) │        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  │  Ready for instant signing (zero network latency)        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Single API call (~100ms)
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                 TURNKEY SECURE ENCLAVE                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Encryption Keypair (P-256)                               │   │
│  │  • Public key: used to encrypt wallet bundles             │   │
│  │  • Private key: exported per-session for decryption       │   │
│  │  • Protected by authentication & optional quorum policies │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Session Flow

```
[Session Start]
    │
    ├─1. User authenticates to your application
    │
    ├─2. Application loads encrypted wallet bundles from storage
    │      (localStorage, IndexedDB, database, S3, etc.)
    │
    ├─3. Application calls Turnkey: exportPrivateKey()
    │      Single request, ~100ms regardless of wallet count
    │
    ├─4. Decryption key received, decrypt all wallet bundles locally
    │      Parallel decryption, sub-second for 100+ wallets
    │
    └─5. User can now sign with ANY wallet instantly
           Zero network latency - all signing is local

[During Session]
    │
    └─► Sign transactions with any wallet (local, instant)
        No Turnkey API calls required for signing

[Session End]
    │
    ├─1. Decryption key "burned" (cleared from memory)
    │
    ├─2. Decrypted wallet keys wiped from memory
    │
    └─3. Encrypted bundles remain in storage for next session
           Safe at rest - useless without Turnkey authentication
```

## Security Model

### At Rest (Between Sessions)

| Component | Location | Security |
|-----------|----------|----------|
| Encrypted wallet bundles | Your infrastructure | Useless without decryption key |
| Decryption key | Turnkey secure enclave | Protected by authentication + policies |

**Compromise scenarios:**
- Your storage compromised → Attacker gets encrypted blobs, cannot decrypt
- Turnkey credentials compromised → Attacker can export key, but has no encrypted bundles
- Both compromised → Full access (same as any 2-of-2 security model)

### During Active Session

| Component | Location | Security |
|-----------|----------|----------|
| Decryption key | Application memory | Cleared on session end |
| Decrypted wallets | Application memory | Cleared on session end |

**Mitigations:**
- Session timeout: automatically end sessions after inactivity
- Secure context: run in iframe or Web Worker for isolation
- Memory wiping: best-effort clearing of sensitive data

### Key Separation Principle

The security of this pattern relies on **never having both components at rest in the same location**:

```
┌──────────────────────────┐     ┌──────────────────────────┐
│   YOUR INFRASTRUCTURE    │     │   TURNKEY ENCLAVE        │
│                          │     │                          │
│  Encrypted Bundles  ✓    │     │  Decryption Key  ✓       │
│  Decryption Key     ✗    │     │  Encrypted Bundles  ✗    │
│                          │     │                          │
└──────────────────────────┘     └──────────────────────────┘
         │                                   │
         └───────────────┬───────────────────┘
                         │
                         ▼
              Both required to decrypt
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your Turnkey credentials

# Launch the interactive CLI
pnpm start
```

## Interactive CLI Menu

The CLI provides a complete walkthrough of the escrow pattern:

### Initial Setup
1. **Create Encryption Key** - Generate a P-256 keypair in Turnkey
2. **Generate & Encrypt Wallets** - Create test wallets and encrypt them

### Per-Session Flow
3. **Start Session** - Export decryption key and decrypt wallet bundles
4. **Sign Message (Demo)** - Sign with any decrypted wallet (local, instant)
5. **End Session** - Burn decryption key and clear memory

### Utilities
- **View Encrypted Store** - Inspect the encrypted wallet bundles

## Environment Variables

```bash
# Required - Turnkey API credentials
API_PUBLIC_KEY="<Your Turnkey API public key>"
API_PRIVATE_KEY="<Your Turnkey API private key>"
BASE_URL="https://api.turnkey.com"
ORGANIZATION_ID="<Your Turnkey organization ID>"

# Created during setup
ENCRYPTION_KEY_ID="<Private key ID from Turnkey>"
```

## Performance Characteristics

| Operation | Time | Network Calls |
|-----------|------|---------------|
| Session start (export key) | ~100ms | 1 |
| Decrypt 10 wallets | ~50ms | 0 |
| Decrypt 100 wallets | ~200ms | 0 |
| Sign transaction | <5ms | 0 |

**Key insight:** Session initialization time is **constant** regardless of wallet count. The single key export takes ~100ms whether you have 10 or 1000 wallets.

## Comparison with Standard Export

| Approach | 10 Wallets | 100 Wallets | 1000 Wallets |
|----------|------------|-------------|--------------|
| Individual exports | ~1s | ~10s | ~100s |
| Encryption escrow | ~150ms | ~300ms | ~1.5s |

The escrow pattern provides **O(1)** session initialization for key export, with only local decryption scaling with wallet count.

## Production Considerations

### Quorum Policies

For additional security, configure quorum policies on the encryption key:

```json
{
  "policyName": "Escrow-Key-Export-Policy",
  "effect": "EFFECT_ALLOW",
  "condition": "activity.type == 'ACTIVITY_TYPE_EXPORT_PRIVATE_KEY' && private_key.id == '<ENCRYPTION_KEY_ID>'",
  "consensus": "approvers.count() >= 2"
}
```

This requires multiple approvers for key export, adding a human-in-the-loop for sensitive operations.

### Session Management

- **Timeout:** Implement automatic session termination after inactivity
- **Refresh:** For long sessions, consider periodic key rotation
- **Audit:** Log session start/end events for compliance

### Storage Options

The encrypted wallet store can be persisted in:

- **Browser localStorage/IndexedDB** - For client-side applications
- **Your backend database** - For server-managed wallets
- **Cloud storage (S3, GCS)** - For distributed access
- **Hardware security modules** - For additional protection

## File Structure

```
encryption-key-escrow/
├── README.md
├── package.json
├── tsconfig.json
├── .env.local.example
└── src/
    ├── interactive.ts       # Main CLI application
    └── shared/
        ├── turnkey.ts       # Turnkey client initialization
        └── crypto-helpers.ts # ECIES encryption utilities
```

## How This Differs from Disaster Recovery

While this example shares cryptographic primitives with the [disaster-recovery](../disaster-recovery) example, the use cases are different:

| Aspect | Disaster Recovery | Encryption Escrow |
|--------|-------------------|-------------------|
| Primary use | Backup & recovery | High-performance signing |
| Session frequency | Rare (emergencies) | Frequent (every user session) |
| Wallet count | Typically few | Potentially hundreds |
| Performance focus | Security | Speed |
| Key export | One-time recovery | Per-session |

## Resources

- [Turnkey Documentation](https://docs.turnkey.com)
- [Secure Enclaves](https://docs.turnkey.com/security/secure-enclaves)
- [Export Private Keys](https://docs.turnkey.com/wallets/export-wallets)
- [Policy Engine](https://docs.turnkey.com/concepts/policies/quickstart)
