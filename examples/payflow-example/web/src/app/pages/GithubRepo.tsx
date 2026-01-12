import { Card } from "../components/ui/card";
import { Github, ExternalLink, FileCode, Shield, Zap, BookOpen } from "lucide-react";
import { Button } from "../components/ui/button";

const GITHUB_URL = "https://github.com/lacrossehub/sdk/tree/main/examples/payflow-example";

export function GithubRepo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Github className="size-8 text-white" />
            <h1 className="text-3xl font-bold text-white">GitHub Repository</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto mb-6">
            Full source code for the Payflow merchant payment processing example using Turnkey's wallet infrastructure.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="size-4 mr-2" />
              View on GitHub
              <ExternalLink className="size-4 ml-2" />
            </a>
          </Button>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="size-5 text-blue-400" />
              <h3 className="font-medium text-white">Instant Wallets</h3>
            </div>
            <p className="text-sm text-slate-400">Create merchant deposit addresses on-demand</p>
          </Card>
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="size-5 text-emerald-400" />
              <h3 className="font-medium text-white">Policy Enforced</h3>
            </div>
            <p className="text-sm text-slate-400">Only USDC transfers to omnibus allowed</p>
          </Card>
          <Card className="p-4 bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <FileCode className="size-5 text-purple-400" />
              <h3 className="font-medium text-white">Full-Stack</h3>
            </div>
            <p className="text-sm text-slate-400">CLI script + React dashboard</p>
          </Card>
        </div>

        {/* README Content */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="size-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">README.md</h2>
          </div>
          
          <div className="prose prose-invert prose-slate max-w-none space-y-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-white mt-0 mb-2">Payflow Example</h1>
            <p className="text-slate-400">
              A demonstration of using Turnkey's wallet infrastructure to build a merchant payment flow where funds are automatically swept to an omnibus wallet.
            </p>

            {/* Overview */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Overview</h2>
            <p className="text-slate-400">This example simulates a payment processing scenario where:</p>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Merchants can create deposit addresses on demand</li>
              <li>Deposit addresses can <strong className="text-white">only</strong> send USDC to a designated omnibus wallet</li>
              <li>Funds are swept from all merchant addresses to the omnibus wallet</li>
            </ul>

            {/* Turnkey Primitives */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Turnkey Primitives Used</h2>
            
            <h3 className="text-lg font-medium text-slate-300">Wallets</h3>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-white">Merchant Wallets</strong>: Created via <code className="text-blue-400">createWallet</code> API with Ethereum accounts (secp256k1, BIP32 derivation)</li>
              <li><strong className="text-white">Wallet Accounts</strong>: Each wallet can have multiple derived addresses via <code className="text-blue-400">createWalletAccounts</code></li>
              <li><strong className="text-white">Omnibus Wallet</strong>: The destination for all swept funds (configured via <code className="text-blue-400">DESTINATION_ADDRESS</code>)</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-300">Policies</h3>
            <p className="text-slate-400">Two policies control what merchant API keys can do:</p>
            
            <div className="my-4">
              <p className="text-sm text-slate-300 mb-2 font-medium">1. Allow USDC Transfers to Omnibus Only</p>
              <pre className="text-xs text-emerald-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`{
  "effect": "EFFECT_ALLOW",
  "condition": "eth.tx.to == '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' 
    && eth.tx.data[0..10] == '0xa9059cbb' 
    && eth.tx.data[34..74] == '99534f20e524954147373ff3a1a0a38ff7442662'"
}`}
              </pre>
              <ul className="text-slate-400 text-sm mt-2 space-y-1 list-disc list-inside">
                <li><code className="text-blue-400">eth.tx.to == '0x1c7d...'</code> — Only allows transactions to the USDC contract</li>
                <li><code className="text-blue-400">eth.tx.data[0..10] == '0xa9059cbb'</code> — Only allows the <code className="text-blue-400">transfer</code> function selector</li>
                <li><code className="text-blue-400">eth.tx.data[34..74] == '99534f20...'</code> — Only allows the transfer recipient (in calldata) to be the omnibus wallet</li>
              </ul>
            </div>

            <div className="my-4">
              <p className="text-sm text-slate-300 mb-2 font-medium">2. Allow Merchant Wallet Creation</p>
              <pre className="text-xs text-emerald-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`{
  "effect": "EFFECT_ALLOW",
  "condition": "activity.type == 'ACTIVITY_TYPE_CREATE_WALLET' 
    || activity.type == 'ACTIVITY_TYPE_CREATE_WALLET_ACCOUNTS'"
}`}
              </pre>
            </div>

            <p className="text-slate-400">All other actions are <strong className="text-white">implicitly denied</strong> by Turnkey's policy engine.</p>

            <h3 className="text-lg font-medium text-slate-300">APIs Used</h3>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li><code className="text-blue-400">createWallet</code> - Create new merchant wallets with Ethereum accounts</li>
              <li><code className="text-blue-400">createWalletAccounts</code> - Derive additional addresses from existing wallets</li>
              <li><code className="text-blue-400">getWallets</code> - List all wallets in the organization</li>
              <li><code className="text-blue-400">getWalletAccounts</code> - List all accounts/addresses for a wallet</li>
              <li><code className="text-blue-400">signTransaction</code> - Sign unsigned Ethereum transactions</li>
            </ul>

            {/* Key Assumptions */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Key Assumptions & Simplifications</h2>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Parent organization owns the omnibus wallet; merchant wallets are created within the same org</li>
              <li>Merchants only need a deposit address - no other controls or capabilities required</li>
              <li>Merchants expect funds to be swept automatically under Payflow's control</li>
              <li>All addresses under all wallets are swept (no filtering by merchant)</li>
              <li>Using Sepolia testnet with test USDC (<code className="text-blue-400">0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238</code>)</li>
              <li>Transactions are constructed, signed via Turnkey, and broadcast via public RPC (not using Turnkey's <code className="text-blue-400">ethSendTransaction</code> helper)</li>
            </ul>

            {/* References */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">References & Examples Leveraged</h2>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-white">Sweeper Example</strong> (<code className="text-blue-400">examples/sweeper/</code>) - Used as the starting point, adapted for USDC-only sweeping</li>
              <li><strong className="text-white">Turnkey Policy Documentation</strong> - <a href="https://docs.turnkey.com/concepts/policies/overview" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Policy Overview</a>, <a href="https://docs.turnkey.com/concepts/policies/language" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Policy Language</a></li>
              <li><strong className="text-white">Turnkey SDK Server</strong> - <a href="https://github.com/tkhq/sdk/tree/main/packages/sdk-server" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">@turnkey/sdk-server</a></li>
              <li><strong className="text-white">Ethereum Policy Examples</strong> - <a href="https://docs.turnkey.com/concepts/policies/examples/ethereum" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Turnkey Ethereum Policy Examples</a></li>
            </ul>

            {/* Time Spent & Tradeoffs */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Time Spent & Tradeoffs Made</h2>
            
            <h3 className="text-lg font-medium text-slate-300">Time Spent</h3>
            <ol className="text-slate-400 space-y-3 list-decimal list-inside">
              <li>In the sweeper example, the program has two different functions; One for sweeping ERC-20 tokens and one for sweeping ETH. The <code className="text-blue-400">sweepETH()</code> function includes <code className="text-blue-400">maxFeePerGas</code> and <code className="text-blue-400">maxPriorityFeePerGas</code> along with the <code className="text-blue-400">gasLimit</code> arguments, but <code className="text-blue-400">sweepTokens()</code> does not. So at first, cloning this example and attempting to dry run it fails out of the box, some investigation was needed.</li>
              <li>After fixing the above, the server side SDK leans on a function <code className="text-blue-400">ethSendTransaction</code> to sign and broadcast the sweep transactions. Attempting to do so threw the following error:
                <pre className="text-xs text-red-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-2 overflow-x-auto">
eth send transaction feature is not enabled for organization &lt;ORGANIZATION-ID&gt;
                </pre>
                <p className="mt-2 text-sm italic">From what I gathered, this SDK function only works with Turnkey's smart accounts, which may be what is used on the sweeper script's initial run, creating a wallet for the user by default if they do not have one. Instead of fighting the SDK, I decided to sign and broadcast manually.</p>
              </li>
              <li>Of the 3-5 hours specified in the doc, I spent about 2:30 to 'get it working' including reading docs and setup, then spent another hour to make sure this script was correct in terms of what the doc was asking for and to write these READMEs. Once I felt that the requirements were satisfied, I prompted and deployed a frontend in ~30 minutes to make the presentation more fun and interesting.</li>
            </ol>

            <h3 className="text-lg font-medium text-slate-300">Tradeoffs Made</h3>
            <ol className="text-slate-400 space-y-3 list-decimal list-inside">
              <li><strong className="text-white">Manual Transaction Construction</strong>: The <code className="text-blue-400">ethSendTransaction</code> feature wasn't enabled for the org, so we construct unsigned transactions with ethers.js, sign via <code className="text-blue-400">signTransaction</code> API, and broadcast via public RPC. This is more verbose but works without smart accounts.</li>
              <li><strong className="text-white">Policy via Calldata Parsing</strong>: The USDC transfer policy parses raw calldata (<code className="text-blue-400">eth.tx.data</code>) to verify both the function selector and recipient address. This avoids requiring an ABI upload to Turnkey for <code className="text-blue-400">contract_call_args</code>. The policy checks bytes 34-74 of the calldata to extract the recipient address from the padded 32-byte parameter.</li>
              <li><strong className="text-white">No Sub-Organizations</strong>: For simplicity, all merchant wallets exist in a single organization rather than using Turnkey's sub-organization feature for multi-tenancy. In a robust setup you would probably want sub-orgs for each merchant wallet for more controls and read-only access from the parent org (Payflow).</li>
              <li><strong className="text-white">Non-Root API Key Required</strong>: Policies don't apply to root users (they bypass all policies), so a separate user (Merchants) (<code className="text-blue-400">MERCHANTS_API_PUBLIC_KEY</code> / <code className="text-blue-400">MERCHANTS_API_PRIVATE_KEY</code>) is needed to test policy enforcement.</li>
              <li><strong className="text-white">Private Key Omnibus Wallet</strong>: I used an individual keypair for the omnibus wallet just for the sake of visual/logical separation. This is probably not a best practice in production.</li>
              <li><strong className="text-white">No Gas Sponsorship</strong>: In order for this to work, merchant wallets need to be seeded with a little bit of Sepolia ETH. In an ideal situation, a separate paymaster wallet would sponsor gas for the merchants so those addresses could be generated without being seeded with ETH.</li>
              <li><strong className="text-white">Wallets vs Addresses</strong>: The take-home docs specified creating a Wallet for each customer rather than an account, which is probably not ideal if you're trying to scale past &gt;100 merchants. I created a wallet and account for each customer here to stick to the docs.</li>
            </ol>

            {/* Setup */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Setup</h2>
            <ol className="text-slate-400 space-y-3 list-decimal list-inside">
              <li>
                <span>Copy <code className="text-blue-400">.env.local.example</code> to <code className="text-blue-400">.env.local</code> and fill in:</span>
                <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-2 overflow-x-auto">
{`ORGANIZATION_ID=<your-org-id>
MERCHANTS_API_PUBLIC_KEY=<non-root-api-public-key>
MERCHANTS_API_PRIVATE_KEY=<non-root-api-private-key>
SIGN_WITH=<default-address-to-sweep>
DESTINATION_ADDRESS=<omnibus-wallet-address>`}
                </pre>
              </li>
              <li>Install dependencies: <code className="text-blue-400">pnpm install</code></li>
              <li>Run the script: <code className="text-blue-400">pnpm start</code></li>
            </ol>

            {/* Usage */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Usage</h2>
            <p className="text-slate-400">The script presents a menu:</p>
            <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`? What would you like to do?
❯ Sweep all wallets
  Create a new merchant wallet
  Sweep a single address
  Test policy denial (WETH to omnibus)
  Test policy denial (USDC to wrong address)`}
            </pre>
            <ul className="text-slate-400 space-y-1 list-disc list-inside mt-4">
              <li><strong className="text-white">Sweep all wallets</strong>: Scans all wallets, checks USDC balances, and sweeps to omnibus</li>
              <li><strong className="text-white">Create a new merchant wallet</strong>: Creates a new wallet and logs the wallet ID and address</li>
              <li><strong className="text-white">Sweep a single address</strong>: Sweeps from the address in <code className="text-blue-400">SIGN_WITH</code></li>
              <li><strong className="text-white">Test policy denial (WETH)</strong>: Attempts to send WETH to omnibus (should be denied - wrong token)</li>
              <li><strong className="text-white">Test policy denial (wrong address)</strong>: Attempts to send USDC to a non-omnibus address (should be denied - wrong destination)</li>
            </ul>

            {/* Testing Workflow */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Testing Workflow</h2>
            <p className="text-slate-400">After creating a merchant wallet via the menu:</p>
            <ol className="text-slate-400 space-y-3 list-decimal list-inside">
              <li>
                <strong className="text-white">Fund the merchant address with Sepolia ETH</strong> (required for gas):
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Get free Sepolia ETH from <a href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Cloud Web3 Faucet</a></li>
                  <li>Send a small amount (0.01 ETH) to the merchant address</li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Simulate a USDC deposit</strong>:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Get free testnet USDC from <a href="https://faucet.circle.com/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Circle's Faucet</a></li>
                  <li>Select "Ethereum Sepolia" as the network</li>
                  <li>Send USDC to the merchant deposit address</li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Run the script again</strong> and select "Sweep all wallets"
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>The script automatically detects USDC balances across all merchant addresses</li>
                  <li>Confirms the sweep and transfers USDC to the omnibus wallet</li>
                </ul>
              </li>
            </ol>

            {/* Web Dashboard */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Web Dashboard</h2>
            <p className="text-slate-400">
              A full-stack web dashboard is available in the <code className="text-blue-400">web/</code> directory. It provides a visual interface for all the same operations as the CLI script.
            </p>
            
            <h3 className="text-lg font-medium text-slate-300">Running the Dashboard</h3>
            <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`cd web
pnpm install
pnpm dev`}
            </pre>
            <p className="text-slate-400 mt-2">This starts:</p>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Frontend at <code className="text-blue-400">http://localhost:5173</code></li>
              <li>Backend API at <code className="text-blue-400">http://localhost:3001</code></li>
            </ul>

            <h3 className="text-lg font-medium text-slate-300">Production Deployment</h3>
            <p className="text-slate-400">The dashboard can be deployed to Railway or similar platforms:</p>
            <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`cd web
pnpm build
pnpm start`}
            </pre>
            <p className="text-slate-400 mt-2">See <code className="text-blue-400">web/README.md</code> for detailed deployment instructions.</p>

            {/* Notes */}
            <h2 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">Notes</h2>
            <ul className="text-slate-400 space-y-1 list-disc list-inside">
              <li>Root users bypass all policies - use the merchant API key to test policy enforcement</li>
              <li>The script continues through all operations even if some fail (e.g., policy denials)</li>
              <li>The policy denies:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>WETH transfers (wrong token - not the USDC contract)</li>
                  <li>USDC transfers to any address other than the omnibus (wrong destination)</li>
                  <li>Native ETH transfers (not a contract call to USDC)</li>
                  <li>Any function other than <code className="text-blue-400">transfer</code> on the USDC contract</li>
                </ul>
              </li>
            </ul>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            className="border-slate-700"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="size-4 mr-2" />
              View Full Repository
              <ExternalLink className="size-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
