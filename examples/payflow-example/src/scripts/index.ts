import * as path from "path";
import * as dotenv from "dotenv";
// Load environment variables from `.env.local`
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { ethers } from "ethers";
import prompts from "prompts";
import { getTurnkeyClient } from "../turnkey";
import { toReadableAmount } from "../utils";
import { ERC20_ABI, USDC_SEPOLIA, WETH_SEPOLIA } from "../tokens";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const CHAIN_ID = 11155111; // Sepolia

export async function main() {
  const orgId = process.env.ORGANIZATION_ID!;
  const turnkey = getTurnkeyClient();
  const destination = process.env.DESTINATION_ADDRESS!;

  // Main menu
  const { action } = await prompts({
    type: "select",
    name: "action",
    message: "What would you like to do?",
    choices: [
      { title: "Sweep all wallets", value: "sweep_all" },
      { title: "Create a new merchant wallet", value: "create" },
      { title: "Sweep a single address", value: "sweep_single" },
      { title: "Test policy denial (WETH to omnibus)", value: "test_deny_weth" },
      { title: "Test policy denial (USDC to wrong address)", value: "test_deny_wrong_addr" },
    ],
  });

  if (action === "sweep_all") {
    await sweepAllWallets(turnkey, orgId, destination);
  } else if (action === "create") {
    const wallet = await createMerchantWallet(turnkey, orgId);
    if (wallet) {
      console.log("You can now fund this address with USDC to test sweeping.");
    }
  } else if (action === "sweep_single") {
    const address = process.env.SIGN_WITH!;
    await sweepSingleAddress(turnkey, orgId, address, destination);
  } else if (action === "test_deny_weth") {
    const address = process.env.SIGN_WITH!;
    await testPolicyDenialWeth(turnkey, orgId, address, destination);
  } else if (action === "test_deny_wrong_addr") {
    const address = process.env.SIGN_WITH!;
    await testPolicyDenialWrongAddress(turnkey, orgId, address);
  }

  console.log("\n✅ Script completed!");
}

/**
 * List all wallets in the organization
 */
async function listWallets(turnkey: any, organizationId: string) {
  const response = await turnkey.apiClient().getWallets({ organizationId });
  return response.wallets;
}

/**
 * List all accounts for a wallet (or all accounts in org if no walletId)
 */
async function listWalletAccounts(
  turnkey: any,
  organizationId: string,
  walletId?: string,
) {
  const response = await turnkey.apiClient().getWalletAccounts({
    organizationId,
    walletId,
    paginationOptions: { limit: "100" },
  });
  return response.accounts;
}

/**
 * Sweep USDC from all wallets and all addresses to omnibus
 */
async function sweepAllWallets(
  turnkey: any,
  organizationId: string,
  destination: string,
) {
  console.log("\n--- Scanning All Wallets ---\n");

  try {
    // List all wallets
    const wallets = await listWallets(turnkey, organizationId);
    console.log(`Found ${wallets.length} wallet(s)\n`);

    if (wallets.length === 0) {
      console.log("No wallets found. Create a merchant wallet first.");
      return;
    }

    // Collect all Ethereum addresses across all wallets
    const allAddresses: { walletName: string; walletId: string; address: string }[] = [];

    for (const wallet of wallets) {
      console.log(`📁 Wallet: ${wallet.walletName} (${wallet.walletId})`);

      const accounts = await listWalletAccounts(turnkey, organizationId, wallet.walletId);

      // Filter for Ethereum addresses only
      const ethAccounts = accounts.filter(
        (acc: any) => acc.addressFormat === "ADDRESS_FORMAT_ETHEREUM"
      );

      for (const account of ethAccounts) {
        console.log(`   └─ ${account.address}`);
        allAddresses.push({
          walletName: wallet.walletName,
          walletId: wallet.walletId,
          address: account.address,
        });
      }
    }

    console.log(`\nTotal Ethereum addresses: ${allAddresses.length}\n`);

    if (allAddresses.length === 0) {
      console.log("No Ethereum addresses found.");
      return;
    }

    // Check USDC balances for all addresses
    console.log("--- Checking USDC Balances ---\n");
    const usdcContract = new ethers.Contract(USDC_SEPOLIA.address, ERC20_ABI, provider);

    const addressesWithBalance: typeof allAddresses & { balance: bigint }[] = [];

    for (const addr of allAddresses) {
      const balance: bigint = await (usdcContract as any).balanceOf(addr.address);
      const ethBalance = await provider.getBalance(addr.address);

      if (balance > 0n) {
        console.log(
          `✅ ${addr.address} - ${toReadableAmount(balance, USDC_SEPOLIA.decimals)} USDC (${ethers.formatEther(ethBalance)} ETH for gas)`
        );
        (addr as any).balance = balance;
        addressesWithBalance.push(addr as any);
      } else {
        console.log(`   ${addr.address} - 0 USDC`);
      }
    }

    if (addressesWithBalance.length === 0) {
      console.log("\nNo addresses with USDC balance to sweep.");
      return;
    }

    // Confirm sweep
    const { confirmSweep } = await prompts({
      type: "confirm",
      name: "confirmSweep",
      message: `Sweep USDC from ${addressesWithBalance.length} address(es) to omnibus?`,
      initial: true,
    });

    if (!confirmSweep) {
      console.log("Sweep cancelled.");
      return;
    }

    // Sweep from each address
    console.log("\n--- Sweeping USDC ---\n");

    for (const addr of addressesWithBalance) {
      console.log(`Sweeping from ${addr.address}...`);
      try {
        await sweepUsdcFromAddress(
          turnkey,
          organizationId,
          addr.address,
          destination,
          (addr as any).balance,
        );
      } catch (error: any) {
        console.error(`❌ Failed to sweep from ${addr.address}: ${error.message}\n`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error scanning wallets: ${error.message}`);
  }
}

/**
 * Sweep USDC from a single address (no prompts, just execute)
 */
async function sweepUsdcFromAddress(
  turnkey: any,
  organizationId: string,
  ownerAddress: string,
  destination: string,
  balance: bigint,
) {
  const iface = new ethers.Interface(ERC20_ABI);
  const calldata = iface.encodeFunctionData("transfer", [destination, balance]);

  const nonce = await provider.getTransactionCount(ownerAddress);
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas!;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
  const gasLimit = 100000n;

  const tx: ethers.TransactionLike = {
    to: USDC_SEPOLIA.address,
    data: calldata,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  };

  const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

  const signedTx = await signWithTurnkey(turnkey, organizationId, ownerAddress, unsignedTx);
  const txResponse = await provider.broadcastTransaction(signedTx);
  console.log(`   Transaction sent: ${txResponse.hash}`);

  const receipt = await txResponse.wait();
  console.log(`   ✅ Swept ${toReadableAmount(balance, USDC_SEPOLIA.decimals)} USDC: https://sepolia.etherscan.io/tx/${receipt?.hash}\n`);
}

/**
 * Sweep a single address (with prompts)
 */
async function sweepSingleAddress(
  turnkey: any,
  organizationId: string,
  address: string,
  destination: string,
) {
  const balance = await provider.getBalance(address);

  console.log("\n--- Wallet Info ---");
  console.log("Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.warn("⚠️  No ETH balance - transactions will fail without gas.\n");
  }

  const tokens = [USDC_SEPOLIA];

  const { sweepUsdc } = await prompts({
    type: "confirm",
    name: "sweepUsdc",
    message: "Sweep USDC to omnibus wallet?",
    initial: true,
  });

  if (sweepUsdc) {
    try {
      await sweepTokens(turnkey, organizationId, address, destination, tokens);
    } catch (error: any) {
      console.error(`❌ USDC sweep failed: ${error.message}\n`);
    }
  }

  // Test ETH sweep (should be denied by policy)
  try {
    await sweepEth(turnkey, organizationId, address, destination);
  } catch (error: any) {
    console.error(`❌ ETH sweep failed (expected - policy only allows USDC): ${error.message}\n`);
  }
}

/**
 * Create a new merchant wallet with an Ethereum account
 */
async function createMerchantWallet(
  turnkey: any,
  organizationId: string,
): Promise<{ walletId: string; address: string } | null> {
  const { walletName } = await prompts({
    type: "text",
    name: "walletName",
    message: "Enter a name for the new merchant wallet:",
    initial: `Merchant-${Date.now()}`,
  });

  if (!walletName) {
    console.log("Wallet creation cancelled.");
    return null;
  }

  console.log(`\nCreating wallet "${walletName}"...`);

  try {
    // Create wallet with one Ethereum account
    const result = await turnkey.apiClient().createWallet({
      organizationId,
      walletName,
      accounts: [
        {
          curve: "CURVE_SECP256K1",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/60'/0'/0/0", // Standard Ethereum derivation path
          addressFormat: "ADDRESS_FORMAT_ETHEREUM",
        },
      ],
    });

    const walletId = result.walletId;
    const address = result.addresses[0];

    console.log("\n✅ Merchant wallet created successfully!");
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log(`│ Wallet ID: ${walletId}`);
    console.log(`│ Address:   ${address}`);
    console.log("└─────────────────────────────────────────────────────────────┘\n");

    return { walletId, address };
  } catch (error: any) {
    console.error(`❌ Failed to create wallet: ${error.message}`);
    return null;
  }
}

/**
 * Attempt to send WETH to the omnibus wallet.
 * This should be DENIED by the policy since only USDC transfers are allowed.
 */
async function testPolicyDenialWeth(
  turnkey: any,
  organizationId: string,
  ownerAddress: string,
  destination: string,
) {
  console.log("\n--- Testing Policy Denial ---");
  console.log("Attempting to send WETH to omnibus (this should be DENIED)...\n");

  const contract = new ethers.Contract(WETH_SEPOLIA.address, ERC20_ABI, provider);
  const balance: bigint = await (contract as any).balanceOf(ownerAddress);

  if (balance === 0n) {
    console.log("No WETH balance to test with. Skipping policy denial test.");
    console.log("To test, first wrap some ETH to WETH on Sepolia.\n");
    return;
  }

  // Only attempt to send a small amount (0.0001 WETH) for testing
  const testAmount = ethers.parseUnits("0.0001", WETH_SEPOLIA.decimals);
  const amountToSend = balance < testAmount ? balance : testAmount;

  console.log(`WETH Balance: ${ethers.formatUnits(balance, WETH_SEPOLIA.decimals)}`);
  console.log(`Attempting to send: ${ethers.formatUnits(amountToSend, WETH_SEPOLIA.decimals)} WETH`);

  // Build calldata for ERC-20 transfer
  const iface = new ethers.Interface(ERC20_ABI);
  const calldata = iface.encodeFunctionData("transfer", [
    destination,
    amountToSend,
  ]);

  // Fetch nonce and fee data
  const nonce = await provider.getTransactionCount(ownerAddress);
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas!;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
  const gasLimit = 100000n;

  // Build unsigned EIP-1559 transaction
  const tx: ethers.TransactionLike = {
    to: WETH_SEPOLIA.address,
    data: calldata,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  };

  const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

  try {
    console.log("Requesting Turnkey to sign WETH transfer...");
    await signWithTurnkey(turnkey, organizationId, ownerAddress, unsignedTx);
    console.log("❌ UNEXPECTED: Transaction was signed! Policy may not be configured correctly.");
  } catch (error: any) {
    console.log("✅ EXPECTED: Transaction was DENIED by policy!");
    console.log(`   Error: ${error.message}\n`);
  }
}

/**
 * Attempt to send USDC to an address that is NOT the omnibus wallet.
 * This should be DENIED by the policy since only transfers to omnibus are allowed.
 */
async function testPolicyDenialWrongAddress(
  turnkey: any,
  organizationId: string,
  ownerAddress: string,
) {
  console.log("\n--- Testing Policy Denial (Wrong Destination) ---");
  console.log("Attempting to send USDC to a random address (NOT omnibus)...\n");

  // Use a random address that is NOT the omnibus
  const wrongDestination = "0x000000000000000000000000000000000000dEaD"; // Burn address

  const contract = new ethers.Contract(USDC_SEPOLIA.address, ERC20_ABI, provider);
  const balance: bigint = await (contract as any).balanceOf(ownerAddress);

  if (balance === 0n) {
    console.log("No USDC balance to test with. Fund the address with USDC first.\n");
    return;
  }

  // Only attempt to send a small amount (1 USDC) for testing
  const testAmount = ethers.parseUnits("1", USDC_SEPOLIA.decimals);
  const amountToSend = balance < testAmount ? balance : testAmount;

  console.log(`USDC Balance: ${toReadableAmount(balance, USDC_SEPOLIA.decimals)}`);
  console.log(`Attempting to send: ${toReadableAmount(amountToSend, USDC_SEPOLIA.decimals)} USDC`);
  console.log(`To: ${wrongDestination} (NOT the omnibus)`);

  // Build calldata for ERC-20 transfer
  const iface = new ethers.Interface(ERC20_ABI);
  const calldata = iface.encodeFunctionData("transfer", [
    wrongDestination,
    amountToSend,
  ]);

  // Fetch nonce and fee data
  const nonce = await provider.getTransactionCount(ownerAddress);
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas!;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
  const gasLimit = 100000n;

  // Build unsigned EIP-1559 transaction
  const tx: ethers.TransactionLike = {
    to: USDC_SEPOLIA.address,
    data: calldata,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2,
  };

  const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

  try {
    console.log("\nRequesting Turnkey to sign USDC transfer to wrong address...");
    await signWithTurnkey(turnkey, organizationId, ownerAddress, unsignedTx);
    console.log("❌ UNEXPECTED: Transaction was signed! Policy may not be configured correctly.");
  } catch (error: any) {
    console.log("✅ EXPECTED: Transaction was DENIED by policy!");
    console.log(`   Error: ${error.message}\n`);
  }
}

/**
 * Sign a transaction using Turnkey's signTransaction API
 */
async function signWithTurnkey(
  turnkey: any,
  organizationId: string,
  signWith: string,
  unsignedTx: string,
): Promise<string> {
  const result = await turnkey.apiClient().signTransaction({
    organizationId,
    signWith,
    unsignedTransaction: unsignedTx,
    type: "TRANSACTION_TYPE_ETHEREUM",
  });

  const signedTx = result.signedTransaction;
  // Ensure 0x prefix for RPC compatibility
  return signedTx.startsWith("0x") ? signedTx : `0x${signedTx}`;
}

async function sweepTokens(
  turnkey: any,
  organizationId: string,
  ownerAddress: string,
  destination: string,
  tokens: any[],
) {
  for (const token of tokens) {
    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
    const balance: bigint = await (contract as any).balanceOf(ownerAddress);

    if (balance === 0n) {
      console.log(`No ${token.symbol}. Skipping...`);
      continue;
    }

    const { confirmed } = await prompts({
      type: "confirm",
      name: "confirmed",
      message: `Transfer ${toReadableAmount(
        balance,
        token.decimals,
      )} ${token.symbol} to ${destination}?`,
    });

    if (!confirmed) continue;

    // Build calldata for ERC-20 transfer
    const iface = new ethers.Interface(ERC20_ABI);
    const calldata = iface.encodeFunctionData("transfer", [
      destination,
      balance,
    ]);

    // Fetch nonce and fee data
    const nonce = await provider.getTransactionCount(ownerAddress);
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas!;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
    const gasLimit = 100000n; // ERC-20 transfers typically need ~65k gas

    // Build unsigned EIP-1559 transaction
    const tx: ethers.TransactionLike = {
      to: token.address,
      data: calldata,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId: CHAIN_ID,
      type: 2, // EIP-1559
    };

    // Serialize the unsigned transaction
    const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

    try {
      console.log(`Signing ${token.symbol} transfer transaction...`);

      // Sign with Turnkey
      const signedTx = await signWithTurnkey(
        turnkey,
        organizationId,
        ownerAddress,
        unsignedTx,
      );

      console.log(`Broadcasting ${token.symbol} transfer...`);

      // Broadcast via provider
      const txResponse = await provider.broadcastTransaction(signedTx);
      console.log(`Transaction sent: ${txResponse.hash}`);

      // Wait for confirmation
      const receipt = await txResponse.wait();
      console.log(
        `✅ Sent ${token.symbol}: https://sepolia.etherscan.io/tx/${receipt?.hash}`,
      );
    } catch (error: any) {
      console.error(`❌ ${token.symbol} transfer failed: ${error.message}\n`);
    }
  }
}

// Don't need this for take home
async function sweepEth(
  turnkey: any,
  organizationId: string,
  ownerAddress: string,
  destination: string,
) {
  const balance = await provider.getBalance(ownerAddress);
  const feeData = await provider.getFeeData();

  const gasLimit = 21000n; // Standard ETH transfer
  const maxFeePerGas = feeData.maxFeePerGas!;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;

  const gasCost = gasLimit * maxFeePerGas;
  const value = balance - gasCost;

  if (value <= 0n) {
    console.warn("Not enough ETH to sweep.");
    return;
  }

  const { confirmed } = await prompts({
    type: "confirm",
    name: "confirmed",
    message: `Sweep ${ethers.formatEther(value)} ETH to ${destination}?`,
  });

  if (!confirmed) return;

  // Fetch nonce
  const nonce = await provider.getTransactionCount(ownerAddress);

  // Build unsigned EIP-1559 transaction
  const tx: ethers.TransactionLike = {
    to: destination,
    value,
    nonce,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: CHAIN_ID,
    type: 2, // EIP-1559
  };

  // Serialize the unsigned transaction
  const unsignedTx = ethers.Transaction.from(tx).unsignedSerialized;

  console.log("Signing ETH transfer transaction...");

  // Sign with Turnkey
  const signedTx = await signWithTurnkey(
    turnkey,
    organizationId,
    ownerAddress,
    unsignedTx,
  );

  console.log("Broadcasting ETH transfer...");

  // Broadcast via provider
  const txResponse = await provider.broadcastTransaction(signedTx);
  console.log(`Transaction sent: ${txResponse.hash}`);

  // Wait for confirmation
  const receipt = await txResponse.wait();
  console.log(`Sent ETH: https://sepolia.etherscan.io/tx/${receipt?.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
