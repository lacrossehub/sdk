import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { MerchantWallet, ActivityLogEntry } from "../App";
import { toast } from "sonner";
import { api } from "../api";

interface CreateWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletCreated: (wallet: MerchantWallet) => void;
  onLogActivity: (entry: Omit<ActivityLogEntry, "id" | "timestamp">) => void;
}

const USDC_CONTRACT = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export function CreateWalletModal({
  open,
  onOpenChange,
  onWalletCreated,
  onLogActivity,
}: CreateWalletModalProps) {
  const [wallet, setWallet] = useState<MerchantWallet | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [walletName, setWalletName] = useState("");

  const generateWallet = async () => {
    setCreating(true);

    try {
      const result = await api.createWallet(walletName || undefined);

      const newWallet: MerchantWallet = {
        uuid: result.walletId,
        address: result.address,
        balance: "0.00",
        ethBalance: "0.00",
        walletName: walletName || `Merchant-${Date.now()}`,
      };

      setWallet(newWallet);
      onWalletCreated(newWallet);
      onLogActivity({
        action: "Create Merchant Wallet",
        status: "success",
        details: `New wallet created: ${newWallet.address}`,
      });
      toast.success("Merchant wallet created successfully!");
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      onLogActivity({
        action: "Create Merchant Wallet",
        status: "error",
        details: `Failed to create wallet: ${error.message}`,
      });
      toast.error(`Failed to create wallet: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    setWallet(null);
    setWalletName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Merchant Wallet</DialogTitle>
        </DialogHeader>

        {!wallet ? (
          <div className="py-4 space-y-4">
            <p className="text-slate-300">
              Generate a new merchant wallet address for accepting USDC payments on Sepolia testnet.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Wallet Name (optional)</label>
              <Input
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder={`Merchant-${Date.now()}`}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button
              onClick={generateWallet}
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                "Generate Wallet"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* UUID */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Wallet ID</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.uuid, "UUID")}
                  className="h-7 text-slate-400 hover:text-white"
                >
                  {copiedField === "UUID" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <code className="text-sm text-white break-all">{wallet.uuid}</code>
            </div>

            {/* Deposit Address */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Deposit Address</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.address, "Address")}
                  className="h-7 text-slate-400 hover:text-white"
                >
                  {copiedField === "Address" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <code className="text-sm text-white break-all">{wallet.address}</code>
            </div>

            {/* Funding Instructions */}
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-3">📝 Funding Instructions</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>To test this wallet, you'll need testnet ETH and USDC:</p>
                <div className="space-y-2 mt-3">
                  <a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium">🔗 ETH Faucet (Google Cloud)</span>
                    <ExternalLink className="size-4 text-blue-400" />
                  </a>
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors"
                  >
                    <span className="font-medium">🔗 USDC Faucet (Circle)</span>
                    <ExternalLink className="size-4 text-blue-400" />
                  </a>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    USDC Contract: <code className="text-slate-300">{USDC_CONTRACT}</code>
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full border-slate-700">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
