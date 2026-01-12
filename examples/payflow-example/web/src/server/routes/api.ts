import { Router } from "express";
import { ethers } from "ethers";
import { getTurnkeyClient } from "../turnkey.js";

const router = Router();

// Constants - MUST match exactly what the CLI script uses
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const CHAIN_ID = 11155111; // Sepolia

// Use the same addresses as the CLI script (from tokens.ts)
const USDC_SEPOLIA = {
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  decimals: 6,
  symbol: "USDC",
};

const WETH_SEPOLIA = {
  address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  decimals: 18,
  symbol: "WETH",
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Use env var directly without transformation - same as CLI
const OMNIBUS_ADDRESS = process.env.DESTINATION_ADDRESS || "0x99534f20E524954147373fF3a1A0a38FF7442662";

// Helper to convert balance to readable format
function toReadableAmount(amount: bigint, decimals: number): string {
  return ethers.formatUnits(amount, decimals);
}

// Sign transaction with Turnkey - exactly like CLI
async function signWithTurnkey(
  turnkey: any,
  organizationId: string,
  signWith: string,
  unsignedTx: string
): Promise<string> {
  const result = await turnkey.apiClient().signTransaction({
    organizationId,
    signWith,
    unsignedTransaction: unsignedTx,
    type: "TRANSACTION_TYPE_ETHEREUM",
  });

  const signedTx = result.signedTransaction;
  return signedTx.startsWith("0x") ? signedTx : `0x${signedTx}`;
}

// Health check
router.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    omnibusAddress: OMNIBUS_ADDRESS,
    usdcAddress: USDC_SEPOLIA.address,
  });
});

// Get config
router.get("/config", (_req, res) => {
  res.json({
    omnibusAddress: OMNIBUS_ADDRESS,
    usdcContract: USDC_SEPOLIA.address,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
  });
});

// List all wallets
router.get("/wallets", async (_req, res) => {
  try {
    const turnkey = getTurnkeyClient();
    const orgId = process.env.ORGANIZATION_ID!;
    
    const response = await turnkey.apiClient().getWallets({ organizationId: orgId });
    
    // For each wallet, get the Ethereum accounts
    const walletsWithAccounts = await Promise.all(
      response.wallets.map(async (wallet: any) => {
        const accountsResponse = await turnkey.apiClient().getWalletAccounts({
          organizationId: orgId,
          walletId: wallet.walletId,
          paginationOptions: { limit: "100" },
        });
        
        const ethAccounts = accountsResponse.accounts.filter(
          (acc: any) => acc.addressFormat === "ADDRESS_FORMAT_ETHEREUM"
        );
        
        return {
          walletId: wallet.walletId,
          walletName: wallet.walletName,
          accounts: ethAccounts.map((acc: any) => ({
            address: acc.address,
            path: acc.path,
          })),
        };
      })
    );
    
    res.json({ wallets: walletsWithAccounts });
  } catch (error: any) {
    console.error("Error listing wallets:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get balances for addresses
router.post("/balances", async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: "addresses array required" });
    }
    
    const usdcContract = new ethers.Contract(USDC_SEPOLIA.address, ERC20_ABI, provider);
    
    const balances = await Promise.all(
      addresses.map(async (address: string) => {
        const usdcBalance: bigint = await (usdcContract as any).balanceOf(address);
        const ethBalance = await provider.getBalance(address);
        
        return {
          address,
          usdc: toReadableAmount(usdcBalance, USDC_SEPOLIA.decimals),
          usdcRaw: usdcBalance.toString(),
          eth: ethers.formatEther(ethBalance),
        };
      })
    );
    
    res.json({ balances });
  } catch (error: any) {
    console.error("Error getting balances:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new merchant wallet
router.post("/wallets/create", async (req, res) => {
  try {
    const { walletName } = req.body;
    const turnkey = getTurnkeyClient();
    const orgId = process.env.ORGANIZATION_ID!;
    
    const result = await turnkey.apiClient().createWallet({
      organizationId: orgId,
      walletName: walletName || `Merchant-${Date.now()}`,
      accounts: [
        {
          curve: "CURVE_SECP256K1",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/60'/0'/0/0",
          addressFormat: "ADDRESS_FORMAT_ETHEREUM",
        },
      ],
    });
    
    res.json({
      walletId: result.walletId,
      address: result.addresses[0],
    });
  } catch (error: any) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ error: error.message });
  }
});

// Sweep USDC from an address - matches CLI sweepUsdcFromAddress exactly
router.post("/sweep/usdc", async (req, res) => {
  try {
    const { fromAddress, amount } = req.body;
    
    if (!fromAddress) {
      return res.status(400).json({ error: "fromAddress required" });
    }
    
    const turnkey = getTurnkeyClient();
    const orgId = process.env.ORGANIZATION_ID!;
    
    // Get balance if amount not provided
    let sweepAmount: bigint;
    if (amount) {
      sweepAmount = BigInt(amount);
    } else {
      const usdcContract = new ethers.Contract(USDC_SEPOLIA.address, ERC20_ABI, provider);
      sweepAmount = await (usdcContract as any).balanceOf(fromAddress);
    }
    
    if (sweepAmount === 0n) {
      return res.status(400).json({ error: "No USDC balance to sweep" });
    }
    
    // Build transfer calldata - exactly like CLI
    const iface = new ethers.Interface(ERC20_ABI);
    const calldata = iface.encodeFunctionData("transfer", [OMNIBUS_ADDRESS, sweepAmount]);
    
    // Get nonce and fee data
    const nonce = await provider.getTransactionCount(fromAddress);
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas!;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
    const gasLimit = 100000n;
    
    // Build unsigned transaction - exactly like CLI
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
    
    // Sign with Turnkey
    const signedTx = await signWithTurnkey(turnkey, orgId, fromAddress, unsignedTx);
    
    // Broadcast
    const txResponse = await provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();
    
    res.json({
      success: true,
      txHash: receipt?.hash,
      amount: toReadableAmount(sweepAmount, USDC_SEPOLIA.decimals),
      from: fromAddress,
      to: OMNIBUS_ADDRESS,
    });
  } catch (error: any) {
    console.error("Error sweeping USDC:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test policy denial (WETH transfer) - matches CLI testPolicyDenial exactly
router.post("/test/policy-denial", async (req, res) => {
  try {
    const { fromAddress } = req.body;
    
    if (!fromAddress) {
      return res.status(400).json({ error: "fromAddress required" });
    }
    
    const turnkey = getTurnkeyClient();
    const orgId = process.env.ORGANIZATION_ID!;
    
    // Check WETH balance - same as CLI
    const wethContract = new ethers.Contract(WETH_SEPOLIA.address, ERC20_ABI, provider);
    const balance: bigint = await (wethContract as any).balanceOf(fromAddress);
    
    if (balance === 0n) {
      return res.json({
        success: false,
        denied: false,
        error: "No WETH balance to test with. Wrap some ETH to WETH on Sepolia first.",
      });
    }
    
    // Only attempt to send a small amount (0.0001 WETH) for testing - same as CLI
    const testAmount = ethers.parseUnits("0.0001", WETH_SEPOLIA.decimals);
    const amountToSend = balance < testAmount ? balance : testAmount;
    
    // Build calldata for ERC-20 transfer - same as CLI
    const iface = new ethers.Interface(ERC20_ABI);
    const calldata = iface.encodeFunctionData("transfer", [OMNIBUS_ADDRESS, amountToSend]);
    
    // Get nonce and fee data
    const nonce = await provider.getTransactionCount(fromAddress);
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas!;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas!;
    const gasLimit = 100000n;
    
    // Build unsigned EIP-1559 transaction - same as CLI
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
      // This should fail due to policy (only USDC transfers are allowed)
      await signWithTurnkey(turnkey, orgId, fromAddress, unsignedTx);
      
      // If we get here, policy didn't block it
      res.json({
        success: false,
        denied: false,
        error: "Transaction was signed! Policy may not be configured correctly.",
      });
    } catch (signError: any) {
      // Expected - policy denied the transaction
      res.json({
        success: true,
        denied: true,
        message: "Transaction was correctly DENIED by policy",
        error: signError.message,
      });
    }
  } catch (error: any) {
    console.error("Error testing policy:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test policy denial (USDC to wrong address) - should be denied
router.post("/test/policy-denial-wrong-address", async (req, res) => {
  try {
    const { fromAddress } = req.body;
    
    if (!fromAddress) {
      return res.status(400).json({ error: "fromAddress required" });
    }
    
    const turnkey = getTurnkeyClient();
    const orgId = process.env.ORGANIZATION_ID!;
    
    // Use a random address that is NOT the omnibus (burn address)
    const wrongDestination = "0x000000000000000000000000000000000000dEaD";
    
    // Check USDC balance
    const usdcContract = new ethers.Contract(USDC_SEPOLIA.address, ERC20_ABI, provider);
    const balance: bigint = await (usdcContract as any).balanceOf(fromAddress);
    
    if (balance === 0n) {
      return res.json({
        success: false,
        denied: false,
        error: "No USDC balance to test with. Fund the address with USDC first.",
      });
    }
    
    // Only attempt to send a small amount (1 USDC) for testing
    const testAmount = ethers.parseUnits("1", USDC_SEPOLIA.decimals);
    const amountToSend = balance < testAmount ? balance : testAmount;
    
    // Build calldata for ERC-20 transfer to WRONG address
    const iface = new ethers.Interface(ERC20_ABI);
    const calldata = iface.encodeFunctionData("transfer", [wrongDestination, amountToSend]);
    
    // Get nonce and fee data
    const nonce = await provider.getTransactionCount(fromAddress);
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
      // This should fail due to policy (only omnibus destination allowed)
      await signWithTurnkey(turnkey, orgId, fromAddress, unsignedTx);
      
      // If we get here, policy didn't block it
      res.json({
        success: false,
        denied: false,
        error: "Transaction was signed! Policy may not be configured correctly.",
      });
    } catch (signError: any) {
      // Expected - policy denied the transaction
      res.json({
        success: true,
        denied: true,
        message: "Transaction was correctly DENIED by policy (wrong destination)",
        error: signError.message,
      });
    }
  } catch (error: any) {
    console.error("Error testing policy:", error);
    res.status(500).json({ error: error.message });
  }
});

export { router as apiRouter };
