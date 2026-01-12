import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Wallet, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { MerchantWallet } from "../App";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface OmnibusBalance {
  usdc: string;
  eth: string;
}

interface WalletOverviewProps {
  wallets: MerchantWallet[];
  loading?: boolean;
  onRefresh?: () => void;
  omnibusBalance?: OmnibusBalance;
}

const OMNIBUS_ADDRESS = "0x99534f20E524954147373fF3a1A0a38FF7442662";

export function WalletOverview({ wallets, loading, onRefresh, omnibusBalance }: WalletOverviewProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success("Address copied to clipboard");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const totalBalance = wallets.reduce(
    (sum, wallet) => sum + parseFloat(wallet.balance),
    0
  );

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Wallet Overview</h2>
        {onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        )}
      </div>

      {/* Omnibus Wallet */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Omnibus Wallet
            </span>
          </div>
          {omnibusBalance && (
            <div className="text-right">
              <div className="text-sm font-semibold text-white">
                {parseFloat(omnibusBalance.usdc).toFixed(2)} USDC
              </div>
              <div className="text-xs text-slate-400">
                {parseFloat(omnibusBalance.eth).toFixed(4)} ETH
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <code className="text-sm text-slate-300">{truncateAddress(OMNIBUS_ADDRESS)}</code>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(OMNIBUS_ADDRESS)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-white"
          >
            {copiedAddress === OMNIBUS_ADDRESS ? (
              <Check className="size-3" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Merchant Wallets */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Merchant Wallets</h3>
          <span className="text-xs text-slate-400">{wallets.length} wallets</span>
        </div>
        {totalBalance > 0 && (
          <div className="mb-3 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
            <div className="text-xs text-emerald-300 mb-1">Total Balance</div>
            <div className="text-xl font-bold text-white">{totalBalance.toFixed(2)} USDC</div>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {loading && wallets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="size-12 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Loading wallets...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Wallet className="size-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No merchant wallets yet</p>
            <p className="text-xs mt-1">Create one using the menu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet, idx) => (
              <div
                key={`${wallet.uuid}-${wallet.address}-${idx}`}
                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 truncate max-w-[120px]" title={wallet.walletName}>
                    {wallet.walletName || `ID: ${wallet.uuid.slice(0, 8)}`}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {parseFloat(wallet.balance).toFixed(2)} USDC
                    </div>
                    <div className="text-xs text-slate-400">
                      {parseFloat(wallet.ethBalance || "0").toFixed(4)} ETH
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-xs text-slate-400">{truncateAddress(wallet.address)}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(wallet.address)}
                    className="h-6 w-6 p-0 text-slate-500 hover:text-white"
                  >
                    {copiedAddress === wallet.address ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
