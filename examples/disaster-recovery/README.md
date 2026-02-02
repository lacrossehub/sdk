# Disaster recovery with Turnkey

This example covers two disaster recovery (DR) paths for existing wallets:

1. **Direct Wallet Import (recommended)**: import wallet private keys into Turnkey’s secure enclaves for immediate operational recovery.
2. **Encryption Key Escrow**: store only encryption keys in Turnkey; keep the encrypted recovery bundle in your own storage.

> [!NOTE]
> The instructions below are intentionally high-level and must be adapted to your organization’s security requirements.

## Prerequisites

- A Turnkey organization with API credentials.
- The Turnkey CLI installed (`tkhq/tkcli`).
- An offline machine (recommended) for key material encryption.

## Path 1: Direct wallet import (recommended)

**Best for**: fast recovery, automated fund sweeping, and centralized policy controls.

### 1) Initialize an import bundle

```bash
turnkey wallets init-import \
  --user $USER_ID \
  --import-bundle-output "./import_bundle.txt" \
  --key-name your-api-key
```

This creates a temporary public key generated inside Turnkey’s enclave that you will use to encrypt the wallet material.

### 2) Encrypt the wallet material offline

```bash
turnkey encrypt \
  --user $USER_ID \
  --import-bundle-input "./import_bundle.txt" \
  --plaintext-input /dev/fd/3 3<<<"$MNEMONIC" \
  --encrypted-bundle-output "./encrypted_bundle.txt" \
  --encryption-key-name your-encryption-key
```

**Tip:** using `/dev/fd/3` avoids writing sensitive material to disk.

### 3) Import into Turnkey

For HD wallets (mnemonic-based):

```bash
turnkey wallets import \
  --user $USER_ID \
  --name "DR-Wallet-BTC-Primary" \
  --encrypted-bundle-input "./encrypted_bundle.txt" \
  --key-name your-api-key
```

For raw private keys:

```bash
turnkey private-keys import \
  --user $USER_ID \
  --name "DR-Key-ETH-Hot" \
  --encrypted-bundle-input "./encrypted_bundle.txt" \
  --curve CURVE_SECP256K1 \
  --address-format ADDRESS_FORMAT_ETHEREUM \
  --key-name your-api-key
```

### 4) (Optional) Sweep funds immediately

Once imported, you can use the SDK to sweep funds under policy control.

```ts
import { Turnkey } from "@turnkey/sdk-server";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { createAccount } from "@turnkey/viem";

const turnkey = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY,
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY,
  defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID,
});

const turnkeyAccount = await createAccount({
  client: turnkey.apiClient(),
  organizationId: process.env.TURNKEY_ORGANIZATION_ID,
  signWith: "0x...", // address of imported wallet
});

const walletClient = createWalletClient({
  account: turnkeyAccount,
  chain: mainnet,
  transport: http(),
});

await walletClient.sendTransaction({
  to: process.env.SAFE_TREASURY_ADDRESS,
  value: BigInt(process.env.SWEEP_AMOUNT_WEI ?? "0"),
});
```

## Path 2: Encryption key escrow (alternative)

**Best for**: keeping wallet material outside Turnkey while still using Turnkey for authenticated access to encryption keys.

### Setup: create an encryption keypair in Turnkey

```ts
import { Turnkey } from "@turnkey/sdk-server";

const turnkey = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.API_PUBLIC_KEY,
  apiPrivateKey: process.env.API_PRIVATE_KEY,
  defaultOrganizationId: process.env.ORGANIZATION_ID,
});

const { privateKeys } = await turnkey.apiClient().createPrivateKeys({
  privateKeys: [{
    privateKeyName: `recovery-key-${userId}`,
    curve: "CURVE_P256",
    addressFormats: [],
  }],
});

const privateKeyId = privateKeys[0].privateKeyId;
const { privateKey } = await turnkey.apiClient().getPrivateKey({ privateKeyId });
const publicKey = privateKey.publicKey;

// Encrypt recovery material locally and store it in your infrastructure.
const encryptedBundle = await encryptWithPublicKey(publicKey, JSON.stringify(recoveryBundle));
await customerApi.storeRecoveryBundle(userId, encryptedBundle);
```

### Recovery: export the encryption key and decrypt

```ts
import { Turnkey } from "@turnkey/sdk-server";
import { generateP256KeyPair, decryptExportBundle } from "@turnkey/crypto";

const turnkey = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPublicKey: process.env.API_PUBLIC_KEY,
  apiPrivateKey: process.env.API_PRIVATE_KEY,
  defaultOrganizationId: process.env.ORGANIZATION_ID,
});

const targetKeyPair = generateP256KeyPair();

const exportResult = await turnkey.apiClient().exportPrivateKey({
  privateKeyId: userEncryptionKeyId,
  targetPublicKey: targetKeyPair.publicKeyUncompressed,
});

const decryptedKey = await decryptExportBundle({
  exportBundle: exportResult.exportBundle,
  embeddedKey: targetKeyPair.privateKey,
  organizationId: process.env.ORGANIZATION_ID,
  returnMnemonic: false,
});

const encryptedBundle = await customerApi.getRecoveryBundle(userId);
const recoveryBundle = JSON.parse(await decryptWithPrivateKey(decryptedKey, encryptedBundle));
```

## Guidance on choosing a path

- **Direct wallet import** is best when you need immediate recovery and policy-controlled automation for sweeping funds.
- **Encryption key escrow** is better when you must keep wallet material outside Turnkey or recover non-wallet secrets.

For more detail, consult Turnkey’s disaster recovery architecture guidance and align with your internal security requirements.
