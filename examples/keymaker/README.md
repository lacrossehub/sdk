# Keymaker

A CLI tool for basic Turnkey API operations. Useful for managing keys, wallets, users, and other resources during development and testing.

## Setup

```bash
# Install dependencies
pnpm install

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local with your Turnkey credentials

# Add 'keymaker' to your PATH (optional but recommended)
pnpm run setup
```

The setup script will:
1. Create a `keymaker` command in `~/bin`
2. Add `~/bin` to your PATH (if not already there)
3. Allow you to run `keymaker` from anywhere

After setup, open a new terminal or run `source ~/.zshrc`, then just type:
```bash
keymaker
```

## Usage

### Interactive Mode (Recommended)

```bash
pnpm start
```

This launches an interactive menu where you can navigate through all available operations:

```
╔════════════════════════════════════════════════════════════╗
║                        KEYMAKER                            ║
║            Turnkey API Management Tool                     ║
╚════════════════════════════════════════════════════════════╝

✓ Connected to organization: 30954c48...

? What would you like to manage?
❯ 🔑  Private Keys
  👛  Wallets
  👤  Users
  📋  Policies
  📜  Activities
  🏢  Organization Info
  ❌  Exit
```

### Command Line Mode

For scripting or quick one-off commands:

```bash
pnpm run cli <command>
```

## Commands

### General

```bash
# Show current API key info and organization stats
pnpm run keymaker whoami

# Get organization configuration
pnpm run keymaker org
```

### Private Keys

```bash
# List all private keys
pnpm run keymaker keys list

# Get details of a specific key
pnpm run keymaker keys get <keyId>

# Delete a private key (with confirmation)
pnpm run keymaker keys delete <keyId>

# Delete without confirmation
pnpm run keymaker keys delete <keyId> --yes
```

### Wallets

```bash
# List all wallets
pnpm run keymaker wallets list

# Get details of a specific wallet
pnpm run keymaker wallets get <walletId>

# List accounts for a wallet
pnpm run keymaker wallets accounts <walletId>

# Delete a wallet (with confirmation)
pnpm run keymaker wallets delete <walletId>

# Delete without confirmation
pnpm run keymaker wallets delete <walletId> --yes
```

### Users

```bash
# List all users
pnpm run keymaker users list

# Get details of a specific user
pnpm run keymaker users get <userId>
```

### Policies

```bash
# List all policies
pnpm run keymaker policies list
```

### Activities

```bash
# List recent activities (default: 10)
pnpm run keymaker activities list

# List more activities
pnpm run keymaker activities list --limit 50

# Get details of a specific activity
pnpm run keymaker activities get <activityId>
```

## Examples

### Delete a problematic key

```bash
# First, find the key ID
pnpm run keymaker keys list

# Then delete it
pnpm run keymaker keys delete pk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Check your credentials are working

```bash
pnpm run keymaker whoami
```

### View recent activity

```bash
pnpm run keymaker activities list --limit 20
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `API_PUBLIC_KEY` | Your Turnkey API public key |
| `API_PRIVATE_KEY` | Your Turnkey API private key |
| `ORGANIZATION_ID` | Your Turnkey organization ID |
| `BASE_URL` | Turnkey API URL (default: `https://api.turnkey.com`) |
