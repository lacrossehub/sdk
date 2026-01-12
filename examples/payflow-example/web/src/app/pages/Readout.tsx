import { Card } from "../components/ui/card";
import { FileText, CheckCircle, XCircle, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export function Readout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <FileText className="size-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Technical Readout</h1>
          </div>
          <p className="text-slate-400">
            Prepared for: Payflow CTO • January 2026
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Subject: Merchant Deposit Address & USDC Sweep PoC
          </p>
        </div>

        {/* Problem Summary */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Problem Summary</h2>
          
          <h3 className="text-lg font-medium text-slate-300 mb-3">Customer Challenge</h3>
          <p className="text-slate-400 mb-4">
            Payflow needs to provide merchants with on-demand deposit addresses while maintaining 
            strict control over fund movements. Key requirements:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Merchant Onboarding", desc: "Merchants need deposit addresses instantly without complex setup" },
              { title: "Fund Security", desc: "Deposited funds should only flow to Payflow's omnibus wallet—no other destinations" },
              { title: "Asset Control", desc: "Only approved assets (USDC) should be transferable; other tokens must be locked" },
              { title: "Operational Simplicity", desc: "Automated sweeping across all merchant addresses without manual intervention" },
            ].map((item) => (
              <div key={item.title} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="font-medium text-white mb-1">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Goals Table */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Goals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-slate-300 font-medium">Goal</th>
                  <th className="pb-3 text-slate-300 font-medium">Success Criteria</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <td className="py-3">Instant deposit addresses</td>
                  <td className="py-3">Merchants receive an address in &lt; 2 seconds</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3">Policy enforcement</td>
                  <td className="py-3">Non-USDC transfers are rejected at signing</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3">Destination lockdown</td>
                  <td className="py-3">Only omnibus wallet can receive funds</td>
                </tr>
                <tr>
                  <td className="py-3">Scalable sweeping</td>
                  <td className="py-3">Scan and sweep all merchant addresses in one operation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Solution Overview Header */}
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Solution Overview</h2>

        {/* Architecture */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Architecture</h2>
          <pre className="text-xs text-slate-400 overflow-x-auto bg-slate-800/50 p-4 rounded-lg border border-slate-700">
{`┌─────────────────────────────────────────────────────────────────────┐
│                      Turnkey Organization                           │
│                         (Payflow)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Merchant   │    │  Merchant   │    │  Merchant   │    ...      │
│  │  Wallet A   │    │  Wallet B   │    │  Wallet C   │             │
│  │  ┌───────┐  │    │  ┌───────┐  │    │  ┌───────┐  │             │
│  │  │ Addr  │  │    │  │ Addr  │  │    │  │ Addr  │  │             │
│  │  │ 0x123 │  │    │  │ 0x456 │  │    │  │ 0x789 │  │             │
│  │  └───┬───┘  │    │  └───┬───┘  │    │  └───┬───┘  │             │
│  └──────┼──────┘    └──────┼──────┘    └──────┼──────┘             │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │  USDC ONLY      │  ◄── Policy Enforced          │
│                   │  (via Policy)   │                               │
│                   └────────┬────────┘                               │
│                            │                                        │
│                   ┌────────▼────────┐                               │
│                   │    Omnibus      │                               │
│                   │    Wallet       │                               │
│                   │    0x995...     │                               │
│                   └─────────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </Card>

        {/* Key Components */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Key Components</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-slate-300 font-medium">Component</th>
                  <th className="pb-3 text-slate-300 font-medium">Implementation</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Merchant Wallets</td>
                  <td className="py-3">Turnkey HD wallets with Ethereum accounts</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Deposit Addresses</td>
                  <td className="py-3">Derived wallet accounts (BIP32 path)</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Transfer Policy</td>
                  <td className="py-3"><code className="text-emerald-400">EFFECT_ALLOW</code> only for USDC → Omnibus</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Sweep Operation</td>
                  <td className="py-3">List wallets → List accounts → Check balances → Sign & broadcast</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Policy Configuration */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Policy Configuration</h2>
          <p className="text-slate-400 mb-4">Two policies enforce the security model:</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">1. Allow USDC Transfers to Omnibus Only</h3>
              <pre className="text-xs text-emerald-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`{
  "effect": "EFFECT_ALLOW",
  "condition": "eth.tx.to == '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238' 
    && eth.tx.data[0..10] == '0xa9059cbb' 
    && eth.tx.data[34..74] == '99534f20e524954147373ff3a1a0a38ff7442662'"
}`}
              </pre>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-start gap-2">
                  <code className="text-blue-400 text-xs shrink-0">eth.tx.to == '0x1c7d...'</code>
                  <ArrowRight className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400">Transaction must be to USDC contract</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="text-blue-400 text-xs shrink-0">eth.tx.data[0..10] == '0xa9059cbb'</code>
                  <ArrowRight className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400">Must call <code className="text-blue-400">transfer</code> function</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="text-blue-400 text-xs shrink-0">eth.tx.data[34..74] == '99534f20...'</code>
                  <ArrowRight className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400">Recipient must be omnibus wallet</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">2. Allow Merchant Wallet Creation</h3>
              <pre className="text-xs text-emerald-400 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`{
  "effect": "EFFECT_ALLOW", 
  "condition": "activity.type == 'ACTIVITY_TYPE_CREATE_WALLET' 
    || activity.type == 'ACTIVITY_TYPE_CREATE_WALLET_ACCOUNTS'"
}`}
              </pre>
            </div>
          </div>
          
          <p className="text-slate-400 mt-4">All other actions → <strong className="text-white">Implicit Deny</strong></p>
        </Card>

        {/* Transaction Flow */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Transaction Flow</h2>
          <pre className="text-xs text-slate-300 overflow-x-auto bg-slate-800/50 p-4 rounded-lg border border-slate-700">
{`1. Merchant requests deposit address
   └─► createWallet() → Returns wallet ID + address

2. Customer deposits USDC to merchant address
   └─► On-chain transfer (external)

3. Payflow initiates sweep
   ├─► getWallets() → List all merchant wallets
   ├─► getWalletAccounts() → Get all addresses per wallet
   ├─► Check USDC balance for each address
   ├─► Build unsigned ERC-20 transfer tx
   ├─► signTransaction() → Turnkey signs (policy checked here)
   └─► Broadcast to network

4. Policy enforcement (at signing time)
   ├─► USDC to Omnibus     ✅ ALLOWED
   ├─► WETH to Omnibus     ❌ DENIED (wrong token)
   ├─► USDC to burn addr   ❌ DENIED (wrong destination)
   └─► Native ETH transfer ❌ DENIED (not USDC contract)`}
          </pre>
        </Card>

        {/* Policy Enforcement Results */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Policy Enforcement Results</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <CheckCircle className="size-5 text-emerald-400" />
              <span className="text-slate-300">USDC to Omnibus</span>
              <span className="ml-auto text-emerald-400 font-medium">ALLOWED</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <XCircle className="size-5 text-red-400" />
              <span className="text-slate-300">WETH to Omnibus</span>
              <span className="ml-auto text-red-400 font-medium">DENIED (wrong token)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <XCircle className="size-5 text-red-400" />
              <span className="text-slate-300">USDC to burn address</span>
              <span className="ml-auto text-red-400 font-medium">DENIED (wrong destination)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <XCircle className="size-5 text-red-400" />
              <span className="text-slate-300">Native ETH transfer</span>
              <span className="ml-auto text-red-400 font-medium">DENIED (not USDC contract)</span>
            </div>
          </div>
        </Card>

        {/* Demo Walkthrough Header */}
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Demo Walkthrough</h2>

        {/* Video Demo Link */}
        <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="size-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Video Demo</h3>
                <p className="text-sm text-slate-400">Watch the full Loom recording</p>
              </div>
            </div>
            <Button asChild className="bg-purple-600 hover:bg-purple-500">
              <Link to="/demo">
                <Play className="size-4 mr-2" />
                Watch Demo
              </Link>
            </Button>
          </div>
        </Card>

        {/* Demo Script */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Demo Script</h2>
          <p className="text-slate-400 mb-4">The demonstration covers the following scenarios:</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-medium text-white mb-2">1. Create Merchant Wallet</h3>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Generate a new merchant wallet on-demand</li>
                <li>Display wallet ID (UUID) and deposit address</li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-medium text-white mb-2">2. Sweep All Wallets</h3>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Scan all wallets in the organization</li>
                <li>Check USDC balances across all addresses</li>
                <li>Execute sweep to omnibus wallet</li>
              </ul>
            </div>
            
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="font-medium text-white mb-2">3. Policy Enforcement Tests</h3>
              <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                <li>Attempt to transfer WETH to omnibus → <span className="text-red-400 font-medium">Denied</span> (wrong token)</li>
                <li>Attempt to transfer USDC to burn address → <span className="text-red-400 font-medium">Denied</span> (wrong destination)</li>
                <li>Transfer USDC to omnibus → <span className="text-emerald-400 font-medium">Allowed</span></li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Running the Demo */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Running the Demo</h2>
          
          <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto mb-4">
{`cd examples/payflow-example
pnpm install
pnpm start`}
          </pre>
          
          <p className="text-slate-400 mb-3">Menu options:</p>
          <pre className="text-xs text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700 overflow-x-auto">
{`? What would you like to do?
❯ Sweep all wallets
  Create a new merchant wallet  
  Sweep a single address
  Test policy denial (WETH to omnibus)
  Test policy denial (USDC to wrong address)`}
          </pre>
        </Card>

        {/* Next Steps */}
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-3">Next Steps</h2>
        
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-slate-300 font-medium">Item</th>
                  <th className="pb-3 text-slate-300 font-medium">Description</th>
                  <th className="pb-3 text-slate-300 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="text-slate-400">
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Sub-organizations</td>
                  <td className="py-3">Isolate merchants into sub-orgs for enhanced security</td>
                  <td className="py-3"><span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs">High</span></td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Webhook integration</td>
                  <td className="py-3">Trigger sweeps on deposit events</td>
                  <td className="py-3"><span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs">Medium</span></td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 font-medium text-white">Multi-token support</td>
                  <td className="py-3">Extend policies for additional stablecoins</td>
                  <td className="py-3"><span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-xs">Medium</span></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Gas optimization</td>
                  <td className="py-3">Batch transactions or use gas station</td>
                  <td className="py-3"><span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">Low</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm italic">
          For technical details, see the full <Link to="/github" className="text-blue-400 hover:underline">README.md</Link>
        </p>
      </div>
    </div>
  );
}
