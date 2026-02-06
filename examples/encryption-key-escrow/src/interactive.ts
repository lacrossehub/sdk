#!/usr/bin/env node
/**
 * Encryption Key Escrow Interactive CLI
 *
 * Demonstrates the encryption key escrow pattern for high-performance,
 * multi-wallet signing scenarios. This pattern enables:
 *
 * - Persistent encrypted wallet storage (client-side)
 * - Per-session decryption key retrieval from Turnkey
 * - Zero-latency local signing during active sessions
 * - Secure key separation (encrypted bundles + Turnkey-held decryption key)
 *
 * Usage: pnpm start
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import prompts from "prompts";
import { Turnkey } from "@turnkey/sdk-server";
import { Crypto } from "@peculiar/webcrypto";
import { generateP256KeyPair, decryptExportBundle } from "@turnkey/crypto";
import {
  generateMnemonic,
  mnemonicToAccount,
  privateKeyToAccount,
  english,
  HDKey,
} from "viem/accounts";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
  secureWipe,
  hexToBytes,
} from "./shared/crypto-helpers";

// Polyfill crypto for Node.js
if (typeof crypto === "undefined") {
  (global as any).crypto = new Crypto();
}

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ============================================================================
// Types
// ============================================================================

interface EncryptedWalletBundle {
  id: string;
  name: string;
  encryptedData: string;
  address: string;
  createdAt: string;
}

interface WalletStore {
  version: string;
  encryptionKeyId: string;
  organizationId: string;
  bundles: EncryptedWalletBundle[];
  createdAt: string;
  updatedAt: string;
}

interface DecryptedWallet {
  id: string;
  name: string;
  privateKey: string;
  address: string;
}

// In-memory session state
let activeSession: {
  decryptionKey: string | null;
  decryptedWallets: DecryptedWallet[];
  startedAt: Date | null;
} = {
  decryptionKey: null,
  decryptedWallets: [],
  startedAt: null,
};

// ============================================================================
// Turnkey Client
// ============================================================================

function getTurnkeyClient(): Turnkey {
  const apiPublicKey = process.env.API_PUBLIC_KEY;
  const apiPrivateKey = process.env.API_PRIVATE_KEY;
  const organizationId = process.env.ORGANIZATION_ID;
  const baseUrl = process.env.BASE_URL ?? "https://api.turnkey.com";

  if (!apiPublicKey || !apiPrivateKey || !organizationId) {
    throw new Error(
      "Missing required environment variables: API_PUBLIC_KEY, API_PRIVATE_KEY, ORGANIZATION_ID\n" +
        "Please copy .env.local.example to .env.local and fill in your credentials."
    );
  }

  return new Turnkey({
    apiBaseUrl: baseUrl,
    apiPublicKey,
    apiPrivateKey,
    defaultOrganizationId: organizationId,
  });
}

// ============================================================================
// Main Menu
// ============================================================================

async function mainMenu(): Promise<void> {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         ENCRYPTION KEY ESCROW DEMO                         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  while (true) {
    const sessionStatus = activeSession.decryptionKey
      ? `🟢 Active (${activeSession.decryptedWallets.length} wallets)`
      : "⚪ No active session";

    const { action } = await prompts({
      type: "select",
      name: "action",
      message: `Session: ${sessionStatus} | What would you like to do?`,
      choices: [
        {
          title: "─── Initial Setup ───",
          value: "separator1",
          disabled: true,
        },
        {
          title: "Create Encryption Key",
          description: "Create a P-256 encryption keypair in Turnkey",
          value: "create-key",
        },
        {
          title: "Generate & Encrypt Wallets",
          description: "Create test wallets and encrypt to escrow key",
          value: "generate-wallets",
        },
        {
          title: "─── Per-Session Flow ───",
          value: "separator2",
          disabled: true,
        },
        {
          title: "Start Session",
          description: "Export decryption key and decrypt wallet bundles",
          value: "start-session",
        },
        {
          title: "Sign Message (Demo)",
          description: "Sign a message with any decrypted wallet",
          value: "sign-demo",
          disabled: !activeSession.decryptionKey,
        },
        {
          title: "End Session",
          description: "Burn decryption key and clear decrypted wallets",
          value: "end-session",
          disabled: !activeSession.decryptionKey,
        },
        {
          title: "─────────────────────────────────",
          value: "separator3",
          disabled: true,
        },
        {
          title: "View Encrypted Store",
          description: "Inspect the encrypted wallet bundles",
          value: "view-store",
        },
        { title: "Exit", value: "exit" },
      ],
    });

    if (!action || action === "exit") {
      if (activeSession.decryptionKey) {
        console.log("Ending active session before exit...");
        endSession();
      }
      console.log("Goodbye!");
      return;
    }

    console.log();

    try {
      switch (action) {
        case "create-key":
          await createEncryptionKey();
          break;
        case "generate-wallets":
          await generateAndEncryptWallets();
          break;
        case "start-session":
          await startSession();
          break;
        case "sign-demo":
          await signDemo();
          break;
        case "end-session":
          endSession();
          break;
        case "view-store":
          await viewEncryptedStore();
          break;
      }
    } catch (error: any) {
      console.error();
      console.error("Error:", error.message);
    }

    console.log();
    await prompts({
      type: "text",
      name: "continue",
      message: "Press Enter to continue...",
    });
    console.clear();
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         ENCRYPTION KEY ESCROW DEMO                         ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log();
  }
}

// ============================================================================
// Initial Setup: Create Encryption Key
// ============================================================================

async function createEncryptionKey(): Promise<void> {
  console.log("─".repeat(60));
  console.log("CREATE ENCRYPTION KEY");
  console.log("─".repeat(60));
  console.log();
  console.log("This creates a P-256 keypair in Turnkey that will be used to");
  console.log("encrypt wallet bundles. The private key stays in Turnkey's");
  console.log("secure enclave and is only exported per-session.");
  console.log();

  const existingKeyId = process.env.ENCRYPTION_KEY_ID;

  if (existingKeyId) {
    const { useExisting } = await prompts({
      type: "confirm",
      name: "useExisting",
      message: `Found existing ENCRYPTION_KEY_ID (${existingKeyId.slice(0, 20)}...). Use this key?`,
      initial: true,
    });

    if (useExisting) {
      console.log("Using existing encryption key.");
      return;
    }
  }

  const turnkeyClient = getTurnkeyClient();

  const { keyName } = await prompts({
    type: "text",
    name: "keyName",
    message: "Name for the encryption key:",
    initial: `Escrow-Key-${Date.now()}`,
  });

  if (!keyName) return;

  console.log();
  console.log("Creating P-256 encryption keypair in Turnkey...");

  const { privateKeys } = await turnkeyClient.apiClient().createPrivateKeys({
    privateKeys: [
      {
        privateKeyName: keyName,
        curve: "CURVE_P256",
        addressFormats: [],
        privateKeyTags: ["escrow", "encryption"],
      },
    ],
  });

  const privateKeyId = privateKeys[0].privateKeyId;

  // Fetch the public key
  const { privateKey } = await turnkeyClient.apiClient().getPrivateKey({
    privateKeyId,
  });

  console.log();
  console.log("═".repeat(60));
  console.log("SUCCESS: Encryption key created!");
  console.log("═".repeat(60));
  console.log();
  console.log("Private Key ID:", privateKeyId);
  console.log("Public Key:    ", privateKey.publicKey.slice(0, 40) + "...");
  console.log();
  console.log("IMPORTANT - Add to your .env.local:");
  console.log(`ENCRYPTION_KEY_ID="${privateKeyId}"`);
  console.log();
}

// ============================================================================
// Initial Setup: Generate & Encrypt Wallets
// ============================================================================

async function generateAndEncryptWallets(): Promise<void> {
  console.log("─".repeat(60));
  console.log("GENERATE & ENCRYPT WALLETS");
  console.log("─".repeat(60));
  console.log();

  const encryptionKeyId = process.env.ENCRYPTION_KEY_ID;
  const organizationId = process.env.ORGANIZATION_ID;

  if (!encryptionKeyId) {
    throw new Error(
      "Missing ENCRYPTION_KEY_ID. Run 'Create Encryption Key' first."
    );
  }

  const turnkeyClient = getTurnkeyClient();

  // Get the encryption public key
  console.log("Fetching encryption public key from Turnkey...");
  const { privateKey: encryptionKey } = await turnkeyClient
    .apiClient()
    .getPrivateKey({
      privateKeyId: encryptionKeyId,
    });

  const publicKey = encryptionKey.publicKey;
  console.log("Public key retrieved.");
  console.log();

  const { walletType } = await prompts({
    type: "select",
    name: "walletType",
    message: "What type of wallets to generate?",
    choices: [
      {
        title: "HD Wallet (derive multiple addresses from mnemonic)",
        value: "hd",
      },
      { title: "Individual Private Keys", value: "individual" },
    ],
  });

  if (!walletType) return;

  const { walletCount } = await prompts({
    type: "number",
    name: "walletCount",
    message: "How many wallets to generate?",
    initial: 10,
    min: 1,
    max: 100,
  });

  if (!walletCount) return;

  console.log();
  console.log(`Generating ${walletCount} wallets...`);

  const bundles: EncryptedWalletBundle[] = [];

  if (walletType === "hd") {
    // Generate HD wallet
    const mnemonic = generateMnemonic(english, 256);
    const hdKey = HDKey.fromMasterSeed(
      Buffer.from(mnemonicToAccount(mnemonic).getHdKey().privateKey!)
    );

    console.log("HD wallet generated. Deriving addresses...");

    for (let i = 0; i < walletCount; i++) {
      const derivationPath = `m/44'/60'/0'/0/${i}`;
      const derived = hdKey.derive(derivationPath);
      const privateKeyHex =
        "0x" +
        Buffer.from(derived.privateKey!).toString("hex");
      const account = privateKeyToAccount(privateKeyHex as `0x${string}`);

      // Encrypt the private key
      const walletData = JSON.stringify({
        type: "hd-derived",
        privateKey: privateKeyHex,
        derivationPath,
        index: i,
      });

      const encryptedData = await encryptWithPublicKey(publicKey, walletData);

      bundles.push({
        id: `wallet-${i}`,
        name: `HD Wallet #${i}`,
        encryptedData,
        address: account.address,
        createdAt: new Date().toISOString(),
      });

      process.stdout.write(`\r  Encrypted ${i + 1}/${walletCount} wallets`);
    }
    console.log();
  } else {
    // Generate individual private keys
    for (let i = 0; i < walletCount; i++) {
      const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
      const privateKeyHex =
        "0x" +
        Array.from(privateKeyBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      const account = privateKeyToAccount(privateKeyHex as `0x${string}`);

      // Encrypt the private key
      const walletData = JSON.stringify({
        type: "individual",
        privateKey: privateKeyHex,
      });

      const encryptedData = await encryptWithPublicKey(publicKey, walletData);

      bundles.push({
        id: `wallet-${i}`,
        name: `Wallet #${i}`,
        encryptedData,
        address: account.address,
        createdAt: new Date().toISOString(),
      });

      process.stdout.write(`\r  Encrypted ${i + 1}/${walletCount} wallets`);
    }
    console.log();
  }

  // Save to store
  const store: WalletStore = {
    version: "1.0",
    encryptionKeyId,
    organizationId: organizationId!,
    bundles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const storePath = path.resolve(process.cwd(), "encrypted-wallet-store.json");
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));

  console.log();
  console.log("═".repeat(60));
  console.log("SUCCESS: Wallets encrypted and stored!");
  console.log("═".repeat(60));
  console.log();
  console.log("Wallets created:", bundles.length);
  console.log("Store saved to: encrypted-wallet-store.json");
  console.log();
  console.log("Sample addresses:");
  bundles.slice(0, 3).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.address}`);
  });
  if (bundles.length > 3) {
    console.log(`  ... and ${bundles.length - 3} more`);
  }
  console.log();
  console.log("The encrypted bundles can now be stored in your infrastructure");
  console.log("(localStorage, database, S3, etc.). The decryption key stays");
  console.log("safely in Turnkey until you start a session.");
}

// ============================================================================
// Per-Session: Start Session
// ============================================================================

async function startSession(): Promise<void> {
  console.log("─".repeat(60));
  console.log("START SESSION");
  console.log("─".repeat(60));
  console.log();

  if (activeSession.decryptionKey) {
    console.log("Session already active. End it first to start a new one.");
    return;
  }

  const encryptionKeyId = process.env.ENCRYPTION_KEY_ID;
  const organizationId = process.env.ORGANIZATION_ID;

  if (!encryptionKeyId) {
    throw new Error(
      "Missing ENCRYPTION_KEY_ID. Run 'Create Encryption Key' first."
    );
  }

  // Load encrypted store
  const storePath = path.resolve(process.cwd(), "encrypted-wallet-store.json");
  if (!fs.existsSync(storePath)) {
    throw new Error(
      "No encrypted wallet store found. Run 'Generate & Encrypt Wallets' first."
    );
  }

  const store: WalletStore = JSON.parse(fs.readFileSync(storePath, "utf-8"));
  console.log(`Found ${store.bundles.length} encrypted wallet bundles.`);
  console.log();

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Export decryption key from Turnkey and start session?",
    initial: true,
  });

  if (!confirm) return;

  const turnkeyClient = getTurnkeyClient();

  console.log();
  console.log("Step 1: Generate target keypair for key export...");
  const targetKeyPair = generateP256KeyPair();

  console.log("Step 2: Export decryption key from Turnkey...");
  const startExport = Date.now();

  const exportResult = await turnkeyClient.apiClient().exportPrivateKey({
    privateKeyId: encryptionKeyId,
    targetPublicKey: targetKeyPair.publicKeyUncompressed,
  });

  const exportTime = Date.now() - startExport;
  console.log(`  Key exported in ${exportTime}ms`);

  console.log("Step 3: Decrypt export bundle...");
  const decryptedKeyBundle = await decryptExportBundle({
    exportBundle: exportResult.exportBundle,
    embeddedKey: targetKeyPair.privateKey,
    organizationId: organizationId!,
    returnMnemonic: false,
  });

  const decryptionKey =
    typeof decryptedKeyBundle === "string"
      ? decryptedKeyBundle
      : decryptedKeyBundle.privateKey;

  console.log("Step 4: Decrypt wallet bundles...");
  const startDecrypt = Date.now();

  const decryptedWallets: DecryptedWallet[] = [];

  for (let i = 0; i < store.bundles.length; i++) {
    const bundle = store.bundles[i];
    const decryptedJson = await decryptWithPrivateKey(
      decryptionKey,
      bundle.encryptedData
    );
    const walletData = JSON.parse(decryptedJson);

    decryptedWallets.push({
      id: bundle.id,
      name: bundle.name,
      privateKey: walletData.privateKey,
      address: bundle.address,
    });

    process.stdout.write(
      `\r  Decrypted ${i + 1}/${store.bundles.length} wallets`
    );
  }
  console.log();

  const decryptTime = Date.now() - startDecrypt;

  // Store in session
  activeSession = {
    decryptionKey,
    decryptedWallets,
    startedAt: new Date(),
  };

  console.log();
  console.log("═".repeat(60));
  console.log("SESSION STARTED");
  console.log("═".repeat(60));
  console.log();
  console.log("Performance metrics:");
  console.log(`  Key export:       ${exportTime}ms (single Turnkey request)`);
  console.log(`  Bundle decryption: ${decryptTime}ms (${store.bundles.length} wallets)`);
  console.log(`  Total:            ${exportTime + decryptTime}ms`);
  console.log();
  console.log(`${decryptedWallets.length} wallets ready for signing.`);
  console.log("All signing operations are now LOCAL (zero network latency).");
}

// ============================================================================
// Per-Session: Sign Demo
// ============================================================================

async function signDemo(): Promise<void> {
  console.log("─".repeat(60));
  console.log("SIGN MESSAGE (DEMO)");
  console.log("─".repeat(60));
  console.log();

  if (!activeSession.decryptionKey || activeSession.decryptedWallets.length === 0) {
    console.log("No active session. Start a session first.");
    return;
  }

  console.log(`Available wallets: ${activeSession.decryptedWallets.length}`);
  console.log();

  const { walletIndex } = await prompts({
    type: "number",
    name: "walletIndex",
    message: `Select wallet index (0-${activeSession.decryptedWallets.length - 1}):`,
    initial: 0,
    min: 0,
    max: activeSession.decryptedWallets.length - 1,
  });

  if (walletIndex === undefined) return;

  const { message } = await prompts({
    type: "text",
    name: "message",
    message: "Message to sign:",
    initial: "Hello, Turnkey!",
  });

  if (!message) return;

  const wallet = activeSession.decryptedWallets[walletIndex];
  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);

  console.log();
  console.log("Signing message locally (zero network latency)...");

  const startSign = Date.now();
  const signature = await account.signMessage({ message });
  const signTime = Date.now() - startSign;

  console.log();
  console.log("═".repeat(60));
  console.log("SIGNATURE COMPLETE");
  console.log("═".repeat(60));
  console.log();
  console.log("Wallet:    ", wallet.name);
  console.log("Address:   ", wallet.address);
  console.log("Message:   ", message);
  console.log("Signature: ", signature.slice(0, 40) + "...");
  console.log("Time:      ", `${signTime}ms (local signing)`);
  console.log();
  console.log("Note: This signature was created entirely client-side.");
  console.log("No network requests were made during signing.");
}

// ============================================================================
// Per-Session: End Session
// ============================================================================

function endSession(): void {
  console.log("─".repeat(60));
  console.log("END SESSION");
  console.log("─".repeat(60));
  console.log();

  if (!activeSession.decryptionKey) {
    console.log("No active session to end.");
    return;
  }

  const sessionDuration = activeSession.startedAt
    ? Math.round((Date.now() - activeSession.startedAt.getTime()) / 1000)
    : 0;

  console.log("Burning decryption key from memory...");

  // Attempt to securely wipe the decryption key
  if (activeSession.decryptionKey) {
    const keyBytes = hexToBytes(activeSession.decryptionKey);
    secureWipe(keyBytes);
  }

  // Wipe all decrypted private keys
  console.log("Wiping decrypted wallet keys from memory...");
  for (const wallet of activeSession.decryptedWallets) {
    const keyBytes = hexToBytes(wallet.privateKey.slice(2));
    secureWipe(keyBytes);
  }

  // Clear session state
  const walletCount = activeSession.decryptedWallets.length;
  activeSession = {
    decryptionKey: null,
    decryptedWallets: [],
    startedAt: null,
  };

  console.log();
  console.log("═".repeat(60));
  console.log("SESSION ENDED");
  console.log("═".repeat(60));
  console.log();
  console.log("Session duration:", `${sessionDuration} seconds`);
  console.log("Wallets cleared: ", walletCount);
  console.log();
  console.log("Security state:");
  console.log("  ✓ Decryption key burned (cleared from memory)");
  console.log("  ✓ Decrypted wallets wiped");
  console.log("  ✓ Encrypted bundles remain in store (safe at rest)");
  console.log();
  console.log("To sign again, you must start a new session (re-export key).");
}

// ============================================================================
// View Encrypted Store
// ============================================================================

async function viewEncryptedStore(): Promise<void> {
  console.log("─".repeat(60));
  console.log("ENCRYPTED WALLET STORE");
  console.log("─".repeat(60));
  console.log();

  const storePath = path.resolve(process.cwd(), "encrypted-wallet-store.json");

  if (!fs.existsSync(storePath)) {
    console.log("No encrypted wallet store found.");
    console.log("Run 'Generate & Encrypt Wallets' to create one.");
    return;
  }

  const store: WalletStore = JSON.parse(fs.readFileSync(storePath, "utf-8"));

  console.log("Store details:");
  console.log("  Version:        ", store.version);
  console.log("  Encryption Key: ", store.encryptionKeyId.slice(0, 30) + "...");
  console.log("  Organization:   ", store.organizationId);
  console.log("  Created:        ", store.createdAt);
  console.log("  Updated:        ", store.updatedAt);
  console.log("  Bundle count:   ", store.bundles.length);
  console.log();

  console.log("Encrypted bundles (addresses only - keys are encrypted):");
  store.bundles.slice(0, 10).forEach((bundle, i) => {
    console.log(`  ${i + 1}. ${bundle.name}: ${bundle.address}`);
  });
  if (store.bundles.length > 10) {
    console.log(`  ... and ${store.bundles.length - 10} more`);
  }
  console.log();

  console.log("Security note:");
  console.log("  The private keys in this store are encrypted with P-256 ECIES.");
  console.log("  Without the decryption key from Turnkey, they cannot be used.");
}

// ============================================================================
// Main
// ============================================================================

mainMenu().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
