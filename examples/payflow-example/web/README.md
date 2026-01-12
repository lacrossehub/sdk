# Payflow Dashboard

A web-based dashboard for managing merchant wallets and USDC sweeping operations using Turnkey.

## Features

- **Create Merchant Wallets** - Generate new Turnkey wallets with Ethereum addresses
- **Sweep All Wallets** - Transfer USDC from all merchant wallets to the omnibus
- **Sweep Single Address** - Transfer USDC from a specific address
- **Test Policy Denial** - Verify that non-USDC transfers are blocked by policy

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Environment variables configured (see below)

## Environment Variables

Create a `.env.local` file in the `payflow-example` root directory (one level up from `web/`):

```bash
# Turnkey Configuration
ORGANIZATION_ID=your_org_id
MERCHANTS_API_PUBLIC_KEY=your_merchant_api_public_key
MERCHANTS_API_PRIVATE_KEY=your_merchant_api_private_key
BASE_URL=https://api.turnkey.com

# Destination for swept funds
DESTINATION_ADDRESS=0x99534f20E524954147373fF3a1A0a38FF7442662
```

## Local Development

```bash
# Install dependencies
pnpm install

# Start both frontend and backend
pnpm dev
```

This will start:
- Frontend (Vite) at http://localhost:5173
- Backend (Express) at http://localhost:3001

The frontend automatically proxies `/api` requests to the backend.

## Production Build

```bash
# Build both frontend and backend
pnpm build

# Start the production server
pnpm start
```

## Deployment to Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Set the following environment variables in Railway:
   - `ORGANIZATION_ID`
   - `MERCHANTS_API_PUBLIC_KEY`
   - `MERCHANTS_API_PRIVATE_KEY`
   - `DESTINATION_ADDRESS`
   - `NODE_ENV=production`
   - `PORT=3001` (optional, Railway sets this automatically)

4. Set the build command: `pnpm build`
5. Set the start command: `pnpm start`
6. Set the root directory to `examples/payflow-example/web`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Get configuration (omnibus address, contracts) |
| GET | `/api/wallets` | List all wallets with accounts |
| POST | `/api/balances` | Get USDC/ETH balances for addresses |
| POST | `/api/wallets/create` | Create a new merchant wallet |
| POST | `/api/sweep/usdc` | Sweep USDC from an address |
| POST | `/api/test/policy-denial` | Test WETH transfer (should be denied) |

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI
- **Backend**: Express.js, TypeScript
- **Blockchain**: ethers.js, Turnkey SDK
- **Network**: Ethereum Sepolia Testnet
