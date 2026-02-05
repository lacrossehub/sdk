#!/usr/bin/env node
/**
 * Keymaker - Interactive CLI for Turnkey API operations
 *
 * Usage: pnpm run keymaker
 */

import prompts from "prompts";
import { getTurnkeyClient, getOrganizationId } from "./turnkey";

// Disable prompts on SIGINT
prompts.override({ onCancel: () => process.exit(0) });

async function main() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                        KEYMAKER                            ║");
  console.log("║            Turnkey API Management Tool                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();

  // Verify credentials on startup
  try {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();
    await turnkey.apiClient().getOrganizationConfigs({ organizationId });
    console.log(`✓ Connected to organization: ${organizationId.slice(0, 8)}...`);
    console.log();
  } catch (error: any) {
    console.error("✗ Failed to connect to Turnkey:", error.message);
    console.error("\nPlease check your .env.local configuration.");
    process.exit(1);
  }

  await mainMenu();
}

async function mainMenu(): Promise<void> {
  while (true) {
    const { choice } = await prompts({
      type: "select",
      name: "choice",
      message: "What would you like to manage?",
      choices: [
        { title: "🔑  Private Keys", value: "keys" },
        { title: "👛  Wallets", value: "wallets" },
        { title: "👤  Users", value: "users" },
        { title: "🏗️   Organizations", value: "orgs" },
        { title: "📋  Policies", value: "policies" },
        { title: "📜  Activities", value: "activities" },
        { title: "🏢  Organization Info", value: "org" },
        { title: "❌  Exit", value: "exit" },
      ],
    });

    if (!choice || choice === "exit") {
      console.log("\nGoodbye!");
      process.exit(0);
    }

    switch (choice) {
      case "keys":
        await keysMenu();
        break;
      case "wallets":
        await walletsMenu();
        break;
      case "users":
        await usersMenu();
        break;
      case "orgs":
        await organizationsMenu();
        break;
      case "policies":
        await policiesMenu();
        break;
      case "activities":
        await activitiesMenu();
        break;
      case "org":
        await showOrgInfo();
        break;
    }
  }
}

// ============================================================================
// PRIVATE KEYS
// ============================================================================

async function keysMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Private Keys:",
      choices: [
        { title: "📋  List all keys", value: "list" },
        { title: "🔍  View key details", value: "get" },
        { title: "🗑️   Delete a key", value: "delete" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    switch (action) {
      case "list":
        await listKeys();
        break;
      case "get":
        await getKeyDetails();
        break;
      case "delete":
        await deleteKey();
        break;
    }
  }
}

async function listKeys(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    const { privateKeys } = await turnkey.apiClient().getPrivateKeys({
      organizationId,
    });

    console.log();
    if (privateKeys.length === 0) {
      console.log("No private keys found.");
    } else {
      console.log(`Found ${privateKeys.length} private key(s):\n`);
      console.log("─".repeat(80));

      for (const key of privateKeys) {
        const created = key.createdAt?.seconds
          ? new Date(Number(key.createdAt.seconds) * 1000).toLocaleDateString()
          : "unknown";
        console.log(`  ${key.privateKeyName}`);
        console.log(`  ID: ${key.privateKeyId}`);
        console.log(`  Curve: ${key.curve} | Created: ${created}`);
        if (key.addresses?.length) {
          console.log(`  Addresses: ${key.addresses.map((a) => a.address).join(", ")}`);
        }
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function getKeyDetails(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  // First, get the list of keys to choose from
  const { privateKeys } = await turnkey.apiClient().getPrivateKeys({
    organizationId,
  });

  if (privateKeys.length === 0) {
    console.log("\nNo private keys found.");
    await pause();
    return;
  }

  const { keyId } = await prompts({
    type: "select",
    name: "keyId",
    message: "Select a key:",
    choices: privateKeys.map((key) => ({
      title: `${key.privateKeyName} (${key.privateKeyId.slice(0, 8)}...)`,
      value: key.privateKeyId,
    })),
  });

  if (!keyId) return;

  try {
    const { privateKey } = await turnkey.apiClient().getPrivateKey({
      privateKeyId: keyId,
    });

    console.log("\n" + JSON.stringify(privateKey, null, 2) + "\n");
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function deleteKey(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  // First, get the list of keys to choose from
  const { privateKeys } = await turnkey.apiClient().getPrivateKeys({
    organizationId,
  });

  if (privateKeys.length === 0) {
    console.log("\nNo private keys found.");
    await pause();
    return;
  }

  const { keyId } = await prompts({
    type: "select",
    name: "keyId",
    message: "Select a key to delete:",
    choices: privateKeys.map((key) => ({
      title: `${key.privateKeyName} (${key.curve})`,
      description: key.privateKeyId,
      value: key.privateKeyId,
    })),
  });

  if (!keyId) return;

  const selectedKey = privateKeys.find((k) => k.privateKeyId === keyId);

  const { confirm } = await prompts({
    type: "text",
    name: "confirm",
    message: `Type "${selectedKey?.privateKeyName}" to confirm deletion:`,
  });

  if (confirm !== selectedKey?.privateKeyName) {
    console.log("\nDeletion cancelled.");
    await pause();
    return;
  }

  try {
    await turnkey.apiClient().deletePrivateKeys({
      privateKeyIds: [keyId],
      deleteWithoutExport: true,
    });

    console.log(`\n✓ Private key "${selectedKey?.privateKeyName}" deleted successfully.`);
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// WALLETS
// ============================================================================

async function walletsMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Wallets:",
      choices: [
        { title: "📋  List all wallets", value: "list" },
        { title: "🔍  View wallet details", value: "get" },
        { title: "📍  View wallet accounts", value: "accounts" },
        { title: "🗑️   Delete a wallet", value: "delete" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    switch (action) {
      case "list":
        await listWallets();
        break;
      case "get":
        await getWalletDetails();
        break;
      case "accounts":
        await listWalletAccounts();
        break;
      case "delete":
        await deleteWallet();
        break;
    }
  }
}

async function listWallets(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    const { wallets } = await turnkey.apiClient().getWallets({
      organizationId,
    });

    console.log();
    if (wallets.length === 0) {
      console.log("No wallets found.");
    } else {
      console.log(`Found ${wallets.length} wallet(s):\n`);
      console.log("─".repeat(80));

      for (const wallet of wallets) {
        const created = wallet.createdAt?.seconds
          ? new Date(Number(wallet.createdAt.seconds) * 1000).toLocaleDateString()
          : "unknown";
        console.log(`  ${wallet.walletName}`);
        console.log(`  ID: ${wallet.walletId}`);
        console.log(`  Accounts: ${wallet.accounts?.length ?? 0} | Created: ${created}`);
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function getWalletDetails(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { wallets } = await turnkey.apiClient().getWallets({ organizationId });

  if (wallets.length === 0) {
    console.log("\nNo wallets found.");
    await pause();
    return;
  }

  const { walletId } = await prompts({
    type: "select",
    name: "walletId",
    message: "Select a wallet:",
    choices: wallets.map((w) => ({
      title: `${w.walletName} (${w.walletId.slice(0, 8)}...)`,
      value: w.walletId,
    })),
  });

  if (!walletId) return;

  try {
    const { wallet } = await turnkey.apiClient().getWallet({ walletId });
    console.log("\n" + JSON.stringify(wallet, null, 2) + "\n");
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function listWalletAccounts(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { wallets } = await turnkey.apiClient().getWallets({ organizationId });

  if (wallets.length === 0) {
    console.log("\nNo wallets found.");
    await pause();
    return;
  }

  const { walletId } = await prompts({
    type: "select",
    name: "walletId",
    message: "Select a wallet:",
    choices: wallets.map((w) => ({
      title: `${w.walletName} (${w.accounts?.length ?? 0} accounts)`,
      value: w.walletId,
    })),
  });

  if (!walletId) return;

  try {
    const { accounts } = await turnkey.apiClient().getWalletAccounts({ walletId });

    console.log();
    if (accounts.length === 0) {
      console.log("No accounts found for this wallet.");
    } else {
      console.log(`Found ${accounts.length} account(s):\n`);
      console.log("─".repeat(80));

      for (const account of accounts) {
        console.log(`  Address: ${account.address}`);
        console.log(`  Path: ${account.path} | Format: ${account.addressFormat}`);
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function deleteWallet(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { wallets } = await turnkey.apiClient().getWallets({ organizationId });

  if (wallets.length === 0) {
    console.log("\nNo wallets found.");
    await pause();
    return;
  }

  const { walletId } = await prompts({
    type: "select",
    name: "walletId",
    message: "Select a wallet to delete:",
    choices: wallets.map((w) => ({
      title: `${w.walletName} (${w.accounts?.length ?? 0} accounts)`,
      value: w.walletId,
    })),
  });

  if (!walletId) return;

  const selectedWallet = wallets.find((w) => w.walletId === walletId);

  const { confirm } = await prompts({
    type: "text",
    name: "confirm",
    message: `Type "${selectedWallet?.walletName}" to confirm deletion:`,
  });

  if (confirm !== selectedWallet?.walletName) {
    console.log("\nDeletion cancelled.");
    await pause();
    return;
  }

  try {
    await turnkey.apiClient().deleteWallets({
      walletIds: [walletId],
      deleteWithoutExport: true,
    });

    console.log(`\n✓ Wallet "${selectedWallet?.walletName}" deleted successfully.`);
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// USERS
// ============================================================================

async function usersMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Users:",
      choices: [
        { title: "📋  List all users", value: "list" },
        { title: "🔍  View user details", value: "get" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    switch (action) {
      case "list":
        await listUsers();
        break;
      case "get":
        await getUserDetails();
        break;
    }
  }
}

async function listUsers(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    const { users } = await turnkey.apiClient().getUsers({ organizationId });

    console.log();
    if (users.length === 0) {
      console.log("No users found.");
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      console.log("─".repeat(80));

      for (const user of users) {
        const created = user.createdAt?.seconds
          ? new Date(Number(user.createdAt.seconds) * 1000).toLocaleDateString()
          : "unknown";
        console.log(`  ${user.userName}`);
        console.log(`  ID: ${user.userId}`);
        console.log(`  Email: ${user.userEmail || "N/A"} | Created: ${created}`);
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function getUserDetails(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { users } = await turnkey.apiClient().getUsers({ organizationId });

  if (users.length === 0) {
    console.log("\nNo users found.");
    await pause();
    return;
  }

  const { userId } = await prompts({
    type: "select",
    name: "userId",
    message: "Select a user:",
    choices: users.map((u) => ({
      title: `${u.userName} (${u.userEmail || "no email"})`,
      value: u.userId,
    })),
  });

  if (!userId) return;

  try {
    const { user } = await turnkey.apiClient().getUser({ userId });
    console.log("\n" + JSON.stringify(user, null, 2) + "\n");
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// ORGANIZATIONS (SUB-ORGANIZATIONS)
// ============================================================================

async function organizationsMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Organizations:",
      choices: [
        { title: "➕  Create sub-organization", value: "create" },
        { title: "📋  List sub-organizations", value: "list" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    switch (action) {
      case "create":
        await createSubOrganization();
        break;
      case "list":
        await listSubOrganizations();
        break;
    }
  }
}

async function listSubOrganizations(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    // Note: This lists sub-organizations under the current organization
    const { organizationConfigs } = await turnkey
      .apiClient()
      .getOrganizationConfigs({ organizationId });

    console.log();
    console.log("─".repeat(60));
    console.log("  Current Organization");
    console.log("─".repeat(60));
    console.log(`  ID: ${organizationId}`);
    console.log();
    console.log("  Note: To list sub-organizations, use the Turnkey dashboard");
    console.log("  or query with a parent organization's credentials.");
    console.log("─".repeat(60));
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function createSubOrganization(): Promise<void> {
  const turnkey = getTurnkeyClient();

  console.log();
  console.log("─".repeat(60));
  console.log("  Create Sub-Organization");
  console.log("─".repeat(60));
  console.log();
  console.log("  This will create a new sub-organization under your");
  console.log("  current organization with a root user.");
  console.log();

  // Get sub-organization name
  const { subOrgName } = await prompts({
    type: "text",
    name: "subOrgName",
    message: "Sub-organization name:",
    validate: (v) => (v.length > 0 ? true : "Name is required"),
  });

  if (!subOrgName) return;

  // Get root user details
  console.log("\n  Root User Configuration:");

  const { userName } = await prompts({
    type: "text",
    name: "userName",
    message: "Root user name:",
    validate: (v) => (v.length > 0 ? true : "Name is required"),
  });

  if (!userName) return;

  const { userEmail } = await prompts({
    type: "text",
    name: "userEmail",
    message: "Root user email (optional):",
  });

  // Ask about authentication method
  const { authMethod } = await prompts({
    type: "select",
    name: "authMethod",
    message: "Root user authentication:",
    choices: [
      { title: "API Key (generate new)", value: "apikey" },
      { title: "Passkey/WebAuthn (provide attestation)", value: "passkey" },
      { title: "None (add later)", value: "none" },
    ],
  });

  if (!authMethod) return;

  let apiKeys: any[] = [];
  let authenticators: any[] = [];

  if (authMethod === "apikey") {
    const { apiKeyName } = await prompts({
      type: "text",
      name: "apiKeyName",
      message: "API key name:",
      initial: `${subOrgName}-root-api-key`,
    });

    // Generate a new API key pair using Web Crypto
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    const publicKeyBuffer = await crypto.subtle.exportKey(
      "raw",
      keyPair.publicKey
    );
    const publicKeyHex = Buffer.from(publicKeyBuffer).toString("hex");

    const privateKeyBuffer = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKeyHex = Buffer.from(privateKeyBuffer).toString("hex");

    apiKeys = [
      {
        apiKeyName: apiKeyName || `${subOrgName}-root-api-key`,
        publicKey: publicKeyHex,
      },
    ];

    console.log();
    console.log("  ⚠️  SAVE THESE CREDENTIALS - they won't be shown again!");
    console.log("─".repeat(60));
    console.log(`  API Key Name:    ${apiKeyName}`);
    console.log(`  Public Key:      ${publicKeyHex.slice(0, 40)}...`);
    console.log(`  Private Key:     ${privateKeyHex.slice(0, 40)}...`);
    console.log("─".repeat(60));
    console.log();

    // Offer to save to file
    const { saveKeys } = await prompts({
      type: "confirm",
      name: "saveKeys",
      message: "Save API keys to file?",
      initial: true,
    });

    if (saveKeys) {
      const fs = await import("fs");
      const path = await import("path");
      const filename = `${subOrgName.replace(/\s+/g, "-").toLowerCase()}-api-keys.json`;
      const filepath = path.resolve(process.cwd(), filename);

      fs.writeFileSync(
        filepath,
        JSON.stringify(
          {
            subOrganizationName: subOrgName,
            apiKeyName: apiKeyName,
            publicKey: publicKeyHex,
            privateKey: privateKeyHex,
            createdAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
      console.log(`  ✓ Saved to ${filename}`);
    }
  }

  // Ask about creating a wallet
  const { createWallet } = await prompts({
    type: "confirm",
    name: "createWallet",
    message: "Create a wallet for this sub-organization?",
    initial: false,
  });

  let wallet: any = undefined;
  if (createWallet) {
    const { walletName } = await prompts({
      type: "text",
      name: "walletName",
      message: "Wallet name:",
      initial: `${subOrgName}-wallet`,
    });

    wallet = {
      walletName: walletName || `${subOrgName}-wallet`,
      accounts: [
        {
          curve: "CURVE_SECP256K1",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/60'/0'/0/0",
          addressFormat: "ADDRESS_FORMAT_ETHEREUM",
        },
      ],
    };
  }

  // Confirm creation
  console.log();
  console.log("─".repeat(60));
  console.log("  Summary");
  console.log("─".repeat(60));
  console.log(`  Sub-org name:  ${subOrgName}`);
  console.log(`  Root user:     ${userName} ${userEmail ? `(${userEmail})` : ""}`);
  console.log(`  Auth method:   ${authMethod}`);
  console.log(`  Create wallet: ${createWallet ? "Yes" : "No"}`);
  console.log("─".repeat(60));

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Create this sub-organization?",
    initial: true,
  });

  if (!confirm) {
    console.log("\nCancelled.");
    await pause();
    return;
  }

  try {
    const result = await turnkey.apiClient().createSubOrganization({
      subOrganizationName: subOrgName,
      rootUsers: [
        {
          userName,
          userEmail: userEmail || undefined,
          apiKeys,
          authenticators,
          oauthProviders: [],
        },
      ],
      rootQuorumThreshold: 1,
      wallet,
    });

    console.log();
    console.log("═".repeat(60));
    console.log("  ✓ Sub-organization created successfully!");
    console.log("═".repeat(60));
    console.log();
    console.log(`  Sub-org ID:    ${result.subOrganizationId}`);
    if (result.rootUserIds?.length) {
      console.log(`  Root user ID:  ${result.rootUserIds[0]}`);
    }
    if (result.wallet) {
      console.log(`  Wallet ID:     ${result.wallet.walletId}`);
      if (result.wallet.addresses?.length) {
        console.log(`  Address:       ${result.wallet.addresses[0]}`);
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError creating sub-organization:", error.message);
  }

  await pause();
}

// ============================================================================
// POLICIES
// ============================================================================

async function policiesMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Policies:",
      choices: [
        { title: "📋  List all policies", value: "list" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    if (action === "list") {
      await listPolicies();
    }
  }
}

async function listPolicies(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    const { policies } = await turnkey.apiClient().getPolicies({ organizationId });

    console.log();
    if (policies.length === 0) {
      console.log("No policies found.");
    } else {
      console.log(`Found ${policies.length} policy(ies):\n`);
      console.log("─".repeat(80));

      for (const policy of policies) {
        console.log(`  ${policy.policyName}`);
        console.log(`  ID: ${policy.policyId}`);
        console.log(`  Effect: ${policy.effect}`);
        if (policy.condition) {
          console.log(`  Condition: ${policy.condition.slice(0, 60)}...`);
        }
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// ACTIVITIES
// ============================================================================

async function activitiesMenu(): Promise<void> {
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Activities:",
      choices: [
        { title: "📋  List recent activities", value: "list" },
        { title: "🔍  View activity details", value: "get" },
        { title: "←   Back to main menu", value: "back" },
      ],
    });

    if (!action || action === "back") return;

    switch (action) {
      case "list":
        await listActivities();
        break;
      case "get":
        await getActivityDetails();
        break;
    }
  }
}

async function listActivities(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { limit } = await prompts({
    type: "number",
    name: "limit",
    message: "How many activities to show?",
    initial: 10,
    min: 1,
    max: 100,
  });

  try {
    const { activities } = await turnkey.apiClient().getActivities({
      organizationId,
      paginationOptions: { limit: String(limit || 10) },
    });

    console.log();
    if (activities.length === 0) {
      console.log("No activities found.");
    } else {
      console.log(`Recent ${activities.length} activity(ies):\n`);
      console.log("─".repeat(80));

      for (const activity of activities) {
        const created = activity.createdAt?.seconds
          ? new Date(Number(activity.createdAt.seconds) * 1000).toLocaleString()
          : "unknown";
        const typeShort = activity.type.replace("ACTIVITY_TYPE_", "");
        console.log(`  [${activity.status}] ${typeShort}`);
        console.log(`  ID: ${activity.id}`);
        console.log(`  Created: ${created}`);
        console.log("─".repeat(80));
      }
    }
    console.log();
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

async function getActivityDetails(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  const { activities } = await turnkey.apiClient().getActivities({
    organizationId,
    paginationOptions: { limit: "20" },
  });

  if (activities.length === 0) {
    console.log("\nNo activities found.");
    await pause();
    return;
  }

  const { activityId } = await prompts({
    type: "select",
    name: "activityId",
    message: "Select an activity:",
    choices: activities.map((a) => ({
      title: `[${a.status}] ${a.type.replace("ACTIVITY_TYPE_", "")}`,
      description: a.id,
      value: a.id,
    })),
  });

  if (!activityId) return;

  try {
    const { activity } = await turnkey.apiClient().getActivity({
      organizationId,
      activityId,
    });
    console.log("\n" + JSON.stringify(activity, null, 2) + "\n");
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// ORGANIZATION
// ============================================================================

async function showOrgInfo(): Promise<void> {
  const turnkey = getTurnkeyClient();
  const organizationId = getOrganizationId();

  try {
    const { organizationConfigs } = await turnkey
      .apiClient()
      .getOrganizationConfigs({ organizationId });

    const { users } = await turnkey.apiClient().getUsers({ organizationId });
    const { wallets } = await turnkey.apiClient().getWallets({ organizationId });
    const { privateKeys } = await turnkey.apiClient().getPrivateKeys({ organizationId });
    const { policies } = await turnkey.apiClient().getPolicies({ organizationId });

    console.log();
    console.log("─".repeat(60));
    console.log("  Organization Information");
    console.log("─".repeat(60));
    console.log(`  Organization ID: ${organizationId}`);
    console.log(`  API Public Key:  ${process.env.API_PUBLIC_KEY?.slice(0, 20)}...`);
    console.log();
    console.log("  Resources:");
    console.log(`    Users:        ${users.length}`);
    console.log(`    Wallets:      ${wallets.length}`);
    console.log(`    Private Keys: ${privateKeys.length}`);
    console.log(`    Policies:     ${policies.length}`);
    console.log("─".repeat(60));
    console.log();

    const { showConfig } = await prompts({
      type: "confirm",
      name: "showConfig",
      message: "Show full organization config?",
      initial: false,
    });

    if (showConfig) {
      console.log("\n" + JSON.stringify(organizationConfigs, null, 2) + "\n");
    }
  } catch (error: any) {
    console.error("\nError:", error.message);
  }

  await pause();
}

// ============================================================================
// HELPERS
// ============================================================================

async function pause(): Promise<void> {
  await prompts({
    type: "invisible",
    name: "continue",
    message: "Press Enter to continue...",
  });
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
