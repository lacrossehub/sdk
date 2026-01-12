import { Card } from "../components/ui/card";
import { FileText, CheckCircle, XCircle, ArrowRight } from "lucide-react";

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
            strict control over fund movements.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Merchant Onboarding", desc: "Merchants need deposit addresses instantly without complex setup" },
              { title: "Fund Security", desc: "Deposited funds should only flow to Payflow's omnibus wallet" },
              { title: "Asset Control", desc: "Only approved assets (USDC) should be transferable" },
              { title: "Operational Simplicity", desc: "Automated sweeping across all merchant addresses" },
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

        {/* Architecture */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Solution Architecture</h2>
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

        {/* Policy Configuration */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Policy Configuration</h2>
          
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
                  <code className="text-blue-400 text-xs">eth.tx.to</code>
                  <ArrowRight className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400">Transaction must be to USDC contract</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="text-blue-400 text-xs">eth.tx.data[0..10]</code>
                  <ArrowRight className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <span className="text-slate-400">Must call transfer function</span>
                </div>
                <div className="flex items-start gap-2">
                  <code className="text-blue-400 text-xs">eth.tx.data[34..74]</code>
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
        </Card>

        {/* Policy Enforcement */}
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

        {/* Next Steps */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4">Next Steps</h2>
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
      </div>
    </div>
  );
}

