import { PlusCircle, Shuffle, Target, AlertTriangle, Ban } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface ActionMenuProps {
  onCreateWallet: () => void;
  onSweepAll: () => void;
  onSweepSingle: () => void;
  onTestPolicyWeth: () => void;
  onTestPolicyWrongAddr: () => void;
}

export function ActionMenu({
  onCreateWallet,
  onSweepAll,
  onSweepSingle,
  onTestPolicyWeth,
  onTestPolicyWrongAddr,
}: ActionMenuProps) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Button
          onClick={onCreateWallet}
          className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0"
        >
          <PlusCircle className="size-5" />
          <div className="text-left">
            <div className="font-semibold">Create Merchant Wallet</div>
            <div className="text-xs opacity-90">Generate new wallet address</div>
          </div>
        </Button>

        <Button
          onClick={onSweepAll}
          className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border-0"
        >
          <Shuffle className="size-5" />
          <div className="text-left">
            <div className="font-semibold">Sweep All Wallets</div>
            <div className="text-xs opacity-90">Transfer from all wallets</div>
          </div>
        </Button>

        <Button
          onClick={onSweepSingle}
          className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-0"
        >
          <Target className="size-5" />
          <div className="text-left">
            <div className="font-semibold">Sweep Single Address</div>
            <div className="text-xs opacity-90">Transfer from specific wallet</div>
          </div>
        </Button>

        <Button
          onClick={onTestPolicyWeth}
          className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-0"
        >
          <AlertTriangle className="size-5" />
          <div className="text-left">
            <div className="font-semibold">Test: Wrong Token</div>
            <div className="text-xs opacity-90">Try WETH → should deny</div>
          </div>
        </Button>

        <Button
          onClick={onTestPolicyWrongAddr}
          className="h-auto py-4 px-4 flex flex-col items-start gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-0"
        >
          <Ban className="size-5" />
          <div className="text-left">
            <div className="font-semibold">Test: Wrong Address</div>
            <div className="text-xs opacity-90">USDC to non-omnibus → deny</div>
          </div>
        </Button>
      </div>
    </Card>
  );
}
