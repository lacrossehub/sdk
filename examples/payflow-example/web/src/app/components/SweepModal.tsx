import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { MerchantWallet, ActivityLogEntry } from "../App";
import { toast } from "sonner";
import { api } from "../api";

interface SweepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "all" | "single";
  wallets: MerchantWallet[];
  onLogActivity: (entry: Omit<ActivityLogEntry, "id" | "timestamp">) => void;
  onWalletBalanceUpdate: (address: string, newBalance: string) => void;
  onRefreshWallets: () => void;
}

const OMNIBUS_ADDRESS = "0x99534f20E524954147373fF3a1A0a38FF7442662";

interface SweepResult {
  address: string;
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
}

export function SweepModal({
  open,
  onOpenChange,
  mode,
  wallets,
  onLogActivity,
  onWalletBalanceUpdate,
  onRefreshWallets,
}: SweepModalProps) {
  const [sweeping, setSweeping] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [results, setResults] = useState<SweepResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSweep = async () => {
    setSweeping(true);
    setResults([]);
    setShowResults(false);

    const walletsToSweep =
      mode === "all"
        ? wallets.filter((w) => parseFloat(w.balance) > 0)
        : wallets.filter((w) => w.address === selectedAddress && parseFloat(w.balance) > 0);

    if (walletsToSweep.length === 0) {
      toast.error("No wallets with balance to sweep");
      setSweeping(false);
      return;
    }

    const sweepResults: SweepResult[] = [];
    let totalSwept = 0;

    for (const wallet of walletsToSweep) {
      try {
        const result = await api.sweepUsdc(wallet.address);

        if (result.success && result.txHash) {
          sweepResults.push({
            address: wallet.address,
            success: true,
            txHash: result.txHash,
            amount: result.amount,
          });
          totalSwept += parseFloat(result.amount || "0");
          onWalletBalanceUpdate(wallet.address, "0.00");

          onLogActivity({
            action: mode === "all" ? "Sweep All Wallets" : "Sweep Single Address",
            status: "success",
            details: `Swept ${result.amount} USDC from ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
            txHash: result.txHash,
          });
        } else {
          throw new Error(result.error || "Unknown error");
        }
      } catch (error: any) {
        sweepResults.push({
          address: wallet.address,
          success: false,
          error: error.message,
        });

        onLogActivity({
          action: mode === "all" ? "Sweep All Wallets" : "Sweep Single Address",
          status: "error",
          details: `Failed to sweep from ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}: ${error.message}`,
        });
      }
    }

    setResults(sweepResults);
    setShowResults(true);
    setSweeping(false);

    const successCount = sweepResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`Successfully swept ${totalSwept.toFixed(2)} USDC from ${successCount} wallet(s)`);
    }
    if (successCount < sweepResults.length) {
      toast.error(`${sweepResults.length - successCount} sweep(s) failed`);
    }

    // Refresh wallet balances
    onRefreshWallets();
  };

  const handleClose = () => {
    setShowResults(false);
    setResults([]);
    setSelectedAddress("");
    onOpenChange(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const walletsWithBalance = wallets.filter((w) => parseFloat(w.balance) > 0);
  const selectedWallet = wallets.find((w) => w.address === selectedAddress);

  if (showResults) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Sweep Results</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "bg-emerald-900/20 border-emerald-500/30"
                    : "bg-red-900/20 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {result.success ? (
                    <CheckCircle className="size-4 text-emerald-400" />
                  ) : (
                    <XCircle className="size-4 text-red-400" />
                  )}
                  <code className="text-sm">{truncateAddress(result.address)}</code>
                </div>
                {result.success ? (
                  <div className="text-sm text-slate-300 ml-6">
                    <p>Swept {result.amount} USDC</p>
                    {result.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                      >
                        View transaction →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-300 ml-6">{result.error}</p>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleClose} variant="outline" className="w-full border-slate-700 mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === "all" ? "Sweep All Wallets" : "Sweep Single Address"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            {mode === "all"
              ? "Transfer USDC from all merchant wallets to the omnibus wallet."
              : "Select a specific wallet address to sweep USDC to the omnibus wallet."}
          </p>

          {mode === "single" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Select Wallet</label>
              <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Choose a wallet address..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {wallets.map((wallet) => (
                    <SelectItem
                      key={wallet.address}
                      value={wallet.address}
                      className="text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{wallet.walletName || "Unnamed"}</span>
                        <span className="text-slate-400">({truncateAddress(wallet.address)})</span>
                        <span className="text-emerald-400">{parseFloat(wallet.balance).toFixed(2)} USDC</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">
                {mode === "all" ? "Wallets to sweep:" : "Selected wallet:"}
              </span>
              <span className="text-white font-medium">
                {mode === "all" ? walletsWithBalance.length : selectedAddress ? 1 : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total amount:</span>
              <span className="text-white font-medium">
                {mode === "all"
                  ? walletsWithBalance.reduce((sum, w) => sum + parseFloat(w.balance), 0).toFixed(2)
                  : selectedWallet
                  ? parseFloat(selectedWallet.balance).toFixed(2)
                  : "0.00"}{" "}
                USDC
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-400">Destination:</span>
              <code className="text-emerald-400 text-xs">{truncateAddress(OMNIBUS_ADDRESS)}</code>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-slate-700"
              disabled={sweeping}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSweep}
              disabled={
                sweeping ||
                (mode === "all" ? walletsWithBalance.length === 0 : !selectedAddress || parseFloat(selectedWallet?.balance || "0") === 0)
              }
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
            >
              {sweeping ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sweeping...
                </>
              ) : (
                "Confirm Sweep"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
