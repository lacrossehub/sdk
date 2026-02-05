#!/usr/bin/env node
/**
 * Keymaker - CLI tool for basic Turnkey API operations
 *
 * Usage: pnpm run keymaker <command> [options]
 */

import { Command } from "commander";
import { getTurnkeyClient, getOrganizationId } from "./turnkey";

const program = new Command();

program
  .name("keymaker")
  .description("CLI tool for basic Turnkey API operations")
  .version("0.1.0");

// ============================================================================
// PRIVATE KEYS
// ============================================================================

const keysCmd = program.command("keys").description("Manage private keys");

keysCmd
  .command("list")
  .description("List all private keys")
  .action(async () => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { privateKeys } = await turnkey.apiClient().getPrivateKeys({
        organizationId,
      });

      if (privateKeys.length === 0) {
        console.log("No private keys found.");
        return;
      }

      console.log(`\nFound ${privateKeys.length} private key(s):\n`);
      console.log("-".repeat(80));

      for (const key of privateKeys) {
        console.log(`ID:        ${key.privateKeyId}`);
        console.log(`Name:      ${key.privateKeyName}`);
        console.log(`Curve:     ${key.curve}`);
        console.log(`Addresses: ${key.addresses?.map((a) => a.address).join(", ") || "none"}`);
        console.log(`Created:   ${key.createdAt?.seconds ? new Date(Number(key.createdAt.seconds) * 1000).toISOString() : "unknown"}`);
        console.log("-".repeat(80));
      }
    } catch (error: any) {
      console.error("Error listing private keys:", error.message);
      process.exit(1);
    }
  });

keysCmd
  .command("get <keyId>")
  .description("Get details of a specific private key")
  .action(async (keyId: string) => {
    const turnkey = getTurnkeyClient();

    try {
      const { privateKey } = await turnkey.apiClient().getPrivateKey({
        privateKeyId: keyId,
      });

      console.log("\nPrivate Key Details:\n");
      console.log(JSON.stringify(privateKey, null, 2));
    } catch (error: any) {
      console.error("Error getting private key:", error.message);
      process.exit(1);
    }
  });

keysCmd
  .command("delete <keyId>")
  .description("Delete a private key")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (keyId: string, options: { yes?: boolean }) => {
    const turnkey = getTurnkeyClient();

    try {
      // First, get the key details to show what we're deleting
      const { privateKey } = await turnkey.apiClient().getPrivateKey({
        privateKeyId: keyId,
      });

      console.log("\nAbout to delete:");
      console.log(`  ID:   ${privateKey.privateKeyId}`);
      console.log(`  Name: ${privateKey.privateKeyName}`);

      if (!options.yes) {
        const readline = await import("readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('\nType "DELETE" to confirm: ', resolve);
        });
        rl.close();

        if (answer !== "DELETE") {
          console.log("Cancelled.");
          return;
        }
      }

      await turnkey.apiClient().deletePrivateKeys({
        privateKeyIds: [keyId],
        deleteWithoutExport: true,
      });

      console.log(`\nPrivate key ${keyId} deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting private key:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// WALLETS
// ============================================================================

const walletsCmd = program.command("wallets").description("Manage wallets");

walletsCmd
  .command("list")
  .description("List all wallets")
  .action(async () => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { wallets } = await turnkey.apiClient().getWallets({
        organizationId,
      });

      if (wallets.length === 0) {
        console.log("No wallets found.");
        return;
      }

      console.log(`\nFound ${wallets.length} wallet(s):\n`);
      console.log("-".repeat(80));

      for (const wallet of wallets) {
        console.log(`ID:       ${wallet.walletId}`);
        console.log(`Name:     ${wallet.walletName}`);
        console.log(`Accounts: ${wallet.accounts?.length ?? 0}`);
        console.log(`Created:  ${wallet.createdAt?.seconds ? new Date(Number(wallet.createdAt.seconds) * 1000).toISOString() : "unknown"}`);
        console.log("-".repeat(80));
      }
    } catch (error: any) {
      console.error("Error listing wallets:", error.message);
      process.exit(1);
    }
  });

walletsCmd
  .command("get <walletId>")
  .description("Get details of a specific wallet")
  .action(async (walletId: string) => {
    const turnkey = getTurnkeyClient();

    try {
      const { wallet } = await turnkey.apiClient().getWallet({
        walletId,
      });

      console.log("\nWallet Details:\n");
      console.log(JSON.stringify(wallet, null, 2));
    } catch (error: any) {
      console.error("Error getting wallet:", error.message);
      process.exit(1);
    }
  });

walletsCmd
  .command("delete <walletId>")
  .description("Delete a wallet")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (walletId: string, options: { yes?: boolean }) => {
    const turnkey = getTurnkeyClient();

    try {
      // First, get the wallet details
      const { wallet } = await turnkey.apiClient().getWallet({
        walletId,
      });

      console.log("\nAbout to delete:");
      console.log(`  ID:       ${wallet.walletId}`);
      console.log(`  Name:     ${wallet.walletName}`);
      console.log(`  Accounts: ${wallet.accounts?.length ?? 0}`);

      if (!options.yes) {
        const readline = await import("readline");
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('\nType "DELETE" to confirm: ', resolve);
        });
        rl.close();

        if (answer !== "DELETE") {
          console.log("Cancelled.");
          return;
        }
      }

      await turnkey.apiClient().deleteWallets({
        walletIds: [walletId],
        deleteWithoutExport: true,
      });

      console.log(`\nWallet ${walletId} deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting wallet:", error.message);
      process.exit(1);
    }
  });

walletsCmd
  .command("accounts <walletId>")
  .description("List accounts for a wallet")
  .action(async (walletId: string) => {
    const turnkey = getTurnkeyClient();

    try {
      const { accounts } = await turnkey.apiClient().getWalletAccounts({
        walletId,
      });

      if (accounts.length === 0) {
        console.log("No accounts found for this wallet.");
        return;
      }

      console.log(`\nFound ${accounts.length} account(s):\n`);
      console.log("-".repeat(80));

      for (const account of accounts) {
        console.log(`Address:  ${account.address}`);
        console.log(`Path:     ${account.path}`);
        console.log(`Format:   ${account.addressFormat}`);
        console.log("-".repeat(80));
      }
    } catch (error: any) {
      console.error("Error listing wallet accounts:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// USERS
// ============================================================================

const usersCmd = program.command("users").description("Manage users");

usersCmd
  .command("list")
  .description("List all users")
  .action(async () => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { users } = await turnkey.apiClient().getUsers({
        organizationId,
      });

      if (users.length === 0) {
        console.log("No users found.");
        return;
      }

      console.log(`\nFound ${users.length} user(s):\n`);
      console.log("-".repeat(80));

      for (const user of users) {
        console.log(`ID:       ${user.userId}`);
        console.log(`Name:     ${user.userName}`);
        console.log(`Email:    ${user.userEmail || "N/A"}`);
        console.log(`Created:  ${user.createdAt?.seconds ? new Date(Number(user.createdAt.seconds) * 1000).toISOString() : "unknown"}`);
        console.log("-".repeat(80));
      }
    } catch (error: any) {
      console.error("Error listing users:", error.message);
      process.exit(1);
    }
  });

usersCmd
  .command("get <userId>")
  .description("Get details of a specific user")
  .action(async (userId: string) => {
    const turnkey = getTurnkeyClient();

    try {
      const { user } = await turnkey.apiClient().getUser({
        userId,
      });

      console.log("\nUser Details:\n");
      console.log(JSON.stringify(user, null, 2));
    } catch (error: any) {
      console.error("Error getting user:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// ORGANIZATION
// ============================================================================

program
  .command("org")
  .description("Get organization details")
  .action(async () => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { organizationConfigs } = await turnkey
        .apiClient()
        .getOrganizationConfigs({
          organizationId,
        });

      console.log("\nOrganization Configuration:\n");
      console.log(JSON.stringify(organizationConfigs, null, 2));
    } catch (error: any) {
      console.error("Error getting organization:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// POLICIES
// ============================================================================

const policiesCmd = program.command("policies").description("Manage policies");

policiesCmd
  .command("list")
  .description("List all policies")
  .action(async () => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { policies } = await turnkey.apiClient().getPolicies({
        organizationId,
      });

      if (policies.length === 0) {
        console.log("No policies found.");
        return;
      }

      console.log(`\nFound ${policies.length} policy(ies):\n`);
      console.log("-".repeat(80));

      for (const policy of policies) {
        console.log(`ID:        ${policy.policyId}`);
        console.log(`Name:      ${policy.policyName}`);
        console.log(`Effect:    ${policy.effect}`);
        console.log(`Condition: ${policy.condition || "none"}`);
        console.log("-".repeat(80));
      }
    } catch (error: any) {
      console.error("Error listing policies:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// ACTIVITIES
// ============================================================================

const activitiesCmd = program
  .command("activities")
  .description("View activities");

activitiesCmd
  .command("list")
  .description("List recent activities")
  .option("-l, --limit <number>", "Number of activities to show", "10")
  .action(async (options: { limit: string }) => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { activities } = await turnkey.apiClient().getActivities({
        organizationId,
        paginationOptions: {
          limit: options.limit,
        },
      });

      if (activities.length === 0) {
        console.log("No activities found.");
        return;
      }

      console.log(`\nRecent activities:\n`);
      console.log("-".repeat(100));

      for (const activity of activities) {
        console.log(`ID:      ${activity.id}`);
        console.log(`Type:    ${activity.type}`);
        console.log(`Status:  ${activity.status}`);
        console.log(`Created: ${activity.createdAt?.seconds ? new Date(Number(activity.createdAt.seconds) * 1000).toISOString() : "unknown"}`);
        console.log("-".repeat(100));
      }
    } catch (error: any) {
      console.error("Error listing activities:", error.message);
      process.exit(1);
    }
  });

activitiesCmd
  .command("get <activityId>")
  .description("Get details of a specific activity")
  .action(async (activityId: string) => {
    const turnkey = getTurnkeyClient();
    const organizationId = getOrganizationId();

    try {
      const { activity } = await turnkey.apiClient().getActivity({
        organizationId,
        activityId,
      });

      console.log("\nActivity Details:\n");
      console.log(JSON.stringify(activity, null, 2));
    } catch (error: any) {
      console.error("Error getting activity:", error.message);
      process.exit(1);
    }
  });

// ============================================================================
// WHOAMI
// ============================================================================

program
  .command("whoami")
  .description("Show current API key info and organization")
  .action(async () => {
    const organizationId = getOrganizationId();
    const apiPublicKey = process.env.API_PUBLIC_KEY;

    console.log("\nCurrent Configuration:\n");
    console.log(`Organization ID: ${organizationId}`);
    console.log(`API Public Key:  ${apiPublicKey}`);
    console.log(`Base URL:        ${process.env.BASE_URL ?? "https://api.turnkey.com"}`);

    // Try to get org info to verify credentials
    try {
      const turnkey = getTurnkeyClient();
      const { organizationConfigs } = await turnkey
        .apiClient()
        .getOrganizationConfigs({
          organizationId,
        });

      console.log(`\nCredentials: Valid`);

      // Get user count
      const { users } = await turnkey.apiClient().getUsers({ organizationId });
      const { wallets } = await turnkey.apiClient().getWallets({ organizationId });
      const { privateKeys } = await turnkey.apiClient().getPrivateKeys({ organizationId });

      console.log(`\nOrganization Stats:`);
      console.log(`  Users:        ${users.length}`);
      console.log(`  Wallets:      ${wallets.length}`);
      console.log(`  Private Keys: ${privateKeys.length}`);
    } catch (error: any) {
      console.log(`\nCredentials: Invalid or expired`);
      console.log(`Error: ${error.message}`);
    }
  });

program.parse();
