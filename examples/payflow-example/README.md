# Payflow Example

A demonstration of using Turnkey's wallet infrastructure to build a merchant payment flow where funds are automatically swept to an omnibus wallet.

## Overview

This example simulates a payment processing scenario where:
- Merchants can create deposit addresses on demand
- Deposit addresses can **only** send USDC to a designated omnibus wallet
- Funds are swept from all merchant addresses to the omnibus wallet

## Turnkey Primitives Used

### Wallets
- **Merchant Wallets**: Created via `createWallet` API with Ethereum accounts (secp256k1, BIP32 derivation)
- **Wallet Accounts**: Each wallet can have multiple derived addresses via `createWalletAccounts`
- **Omnibus Wallet**: The destination for all swept funds (configured via `DESTINATION_ADDRESS`)

### Policies
Two policies control what merchant API keys can do:

1. **Allow USDC Transfers to Omnibus Only** (`policies/allow-usdc-outbound-omnibus-only.json`)
   ```json
   {
     "effect": "EFFECT_ALLOW",
     "condition": "eth.tx.to == '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' && eth.tx.data[0..10] == '0xa9059cbb' && eth.tx.data[34..74] == '99534f20e524954147373ff3a1a0a38ff7442662'"
   }
   ```
   - `eth.tx.to == '0x1c7d...'` — Only allows transactions to the USDC contract
   - `eth.tx.data[0..10] == '0xa9059cbb'` — Only allows the `transfer` function selector
   - `eth.tx.data[34..74] == '99534f20...'` — Only allows the transfer recipient (in calldata) to be the omnibus wallet

2. **Allow Merchant Wallet Creation** (`policies/allow-merchant-wallet-creation.json`)
   ```json
   {
     "effect": "EFFECT_ALLOW",
     "condition": "activity.type == 'ACTIVITY_TYPE_CREATE_WALLET' || activity.type == 'ACTIVITY_TYPE_CREATE_WALLET_ACCOUNTS'"
   }
   ```

All other actions are **implicitly denied** by Turnkey's policy engine.

### APIs Used
- `createWallet` - Create new merchant wallets with Ethereum accounts
- `createWalletAccounts` - Derive additional addresses from existing wallets
- `getWallets` - List all wallets in the organization
- `getWalletAccounts` - List all accounts/addresses for a wallet
- `signTransaction` - Sign unsigned Ethereum transactions

## Key Assumptions & Simplifications

- Parent organization owns the omnibus wallet; merchant wallets are created within the same org
- Merchants only need a deposit address - no other controls or capabilities required
- Merchants expect funds to be swept automatically under Payflow's control
- All addresses under all wallets are swept (no filtering by merchant)
- Using Sepolia testnet with test USDC (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`)
- Transactions are constructed, signed via Turnkey, and broadcast via public RPC (not using Turnkey's `ethSendTransaction` helper)

## References & Examples Leveraged

- **Sweeper Example** (`examples/sweeper/`) - Used as the starting point, adapted for USDC-only sweeping
- **Turnkey Policy Documentation** - [Policy Overview](https://docs.turnkey.com/concepts/policies/overview), [Policy Language](https://docs.turnkey.com/concepts/policies/language)
- **Turnkey SDK Server** - [@turnkey/sdk-server](https://github.com/tkhq/sdk/tree/main/packages/sdk-server)
- **Ethereum Policy Examples** - [Turnkey Ethereum Policy Examples](https://docs.turnkey.com/concepts/policies/examples/ethereum)

## Time Spent & Tradeoffs Made

### Time Spent
1. In the sweeper example, the program has two different functions; One for sweeping ERC-20 tokens and one for sweeping ETH. The `sweepETH()` function includes `maxFeePerGas` and `maxPriorityFeePerGas` along with the `gasLimit` arguments, but `sweepTokens()` does not. So at first, cloning this example and attempting to dry run it fails out of the box, some investigation was needed.
2. After fixing the above, the server side SDK leans on a function `ethSendTransaction` to sign and broadcast the sweep transactions. Attempting to do so threw the following error:
```
eth send transaction feature is not enabled for organization <ORGANIZATION-ID>
```
> From what I gathered, this SDK function only works with Turnkey's smart accounts, which may be what is used on the sweeper script's initial run, creating a wallet for the user by default if they do not have one. Instead of fighting the SDK, I decided to sign and broadcast manually.

3. Of the 3-5 hours specified in the doc, I spent about 2:30 to 'get it working' including reading docs and setup, then spent another hour to make sure this script was correct in terms of what the doc was asking for and to write these READMEs. Once I felt that the requirements were satisfied, I prompted and deployed a frontend in ~30 minutes to make the presentation more fun and interesting.

### Tradeoffs Made

1. **Manual Transaction Construction**: The `ethSendTransaction` feature wasn't enabled for the org, so we construct unsigned transactions with ethers.js, sign via `signTransaction` API, and broadcast via public RPC. This is more verbose but works without smart accounts.

2. **Policy via Calldata Parsing**: The USDC transfer policy parses raw calldata (`eth.tx.data`) to verify both the function selector and recipient address. This avoids requiring an ABI upload to Turnkey for `contract_call_args`. The policy checks bytes 34-74 of the calldata to extract the recipient address from the padded 32-byte parameter. 

3. **No Sub-Organizations**: For simplicity, all merchant wallets exist in a single organization rather than using Turnkey's sub-organization feature for multi-tenancy. In a robust setup you would probably want sub-orgs for each merchant wallet for more controls and read-only access from the parent org (Payflow).

4. **Non-Root API Key Required**: Policies don't apply to root users (they bypass all policies), so a separate user (Merchants) (`MERCHANTS_API_PUBLIC_KEY` / `MERCHANTS_API_PRIVATE_KEY`) is needed to test policy enforcement.

5. **Private Key Omnibus Wallet**: I used an individual keypair for the omnibus wallet just for the sake of visual/logical separation. This is probably not a best practice in production.

6. **No Gas Sponsorship**: In order for this to work, merchant wallets need to be seeded with a little bit of Sepolia ETH. In an ideal situation, a separate paymaster wallet would sponsor gas for the merchants so those addresses could be generated without being seeded with ETH.

7. **Wallets vs Addresses**: The take-home docs specified creating a Wallet for each customer rather than an account, which is probably not ideal if you're trying to scale past >100 merchants. I created a wallet and account for each customer here to stick to the docs. 

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   ORGANIZATION_ID=<your-org-id>
   MERCHANTS_API_PUBLIC_KEY=<non-root-api-public-key>
   MERCHANTS_API_PRIVATE_KEY=<non-root-api-private-key>
   SIGN_WITH=<default-address-to-sweep>
   DESTINATION_ADDRESS=<omnibus-wallet-address>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the script:
   ```bash
   pnpm start
   ```

## Usage

The script presents a menu:
```
? What would you like to do?
❯ Sweep all wallets
  Create a new merchant wallet
  Sweep a single address
  Test policy denial (WETH to omnibus)
  Test policy denial (USDC to wrong address)
```

- **Sweep all wallets**: Scans all wallets, checks USDC balances, and sweeps to omnibus
- **Create a new merchant wallet**: Creates a new wallet and logs the wallet ID and address
- **Sweep a single address**: Sweeps from the address in `SIGN_WITH`
- **Test policy denial (WETH)**: Attempts to send WETH to omnibus (should be denied - wrong token)
- **Test policy denial (wrong address)**: Attempts to send USDC to a non-omnibus address (should be denied - wrong destination)

## Testing Workflow

After creating a merchant wallet via the menu:

1. **Fund the merchant address with Sepolia ETH** (required for gas):
   - Get free Sepolia ETH from [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - Send a small amount (0.01 ETH) to the merchant address

2. **Simulate a USDC deposit**:
   - Get free testnet USDC from [Circle's Faucet](https://faucet.circle.com/)
   - Select "Ethereum Sepolia" as the network
   - Send USDC to the merchant deposit address

3. **Run the script again** and select "Sweep all wallets"
   - The script automatically detects USDC balances across all merchant addresses
   - Confirms the sweep and transfers USDC to the omnibus wallet

## Web Dashboard

A full-stack web dashboard is available in the `web/` directory. It provides a visual interface for all the same operations as the CLI script.

### Running the Dashboard

```bash
cd web
pnpm install
pnpm dev
```

This starts:
- Frontend at http://localhost:5173
- Backend API at http://localhost:3001

### Production Deployment

The dashboard can be deployed to Railway or similar platforms:

```bash
cd web
pnpm build
pnpm start
```

See `web/README.md` for detailed deployment instructions.

## Notes

- Root users bypass all policies - use the merchant API key to test policy enforcement
- The script continues through all operations even if some fail (e.g., policy denials)
- The policy denies:
  - WETH transfers (wrong token - not the USDC contract)
  - USDC transfers to any address other than the omnibus (wrong destination)
  - Native ETH transfers (not a contract call to USDC)
  - Any function other than `transfer` on the USDC contract

