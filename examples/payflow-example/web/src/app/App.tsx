import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ActionMenu } from "./components/ActionMenu";
import { ActivityLog } from "./components/ActivityLog";
import { WalletOverview } from "./components/WalletOverview";
import { CreateWalletModal } from "./components/CreateWalletModal";
import { SweepModal } from "./components/SweepModal";
import { TestPolicyModal } from "./components/TestPolicyModal";
import { Toaster } from "./components/ui/sonner";
import { api, type Wallet, type Balance } from "./api";
import { toast } from "sonner";

export type ActivityLogEntry = {
  id: string;
  timestamp: Date;
  action: string;
  status: "success" | "denied" | "pending" | "error";
  details: string;
  txHash?: string;
};

export type MerchantWallet = {
  uuid: string;
  address: string;
  balance: string;
  ethBalance: string;
  walletName?: string;
};

export default function App() {
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [wallets, setWallets] = useState<MerchantWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [createWalletOpen, setCreateWalletOpen] = useState(false);
  const [sweepAllOpen, setSweepAllOpen] = useState(false);
  const [sweepSingleOpen, setSweepSingleOpen] = useState(false);
  const [testPolicyWethOpen, setTestPolicyWethOpen] = useState(false);
  const [testPolicyWrongAddrOpen, setTestPolicyWrongAddrOpen] = useState(false);

  const addActivityLog = useCallback((entry: Omit<ActivityLogEntry, "id" | "timestamp">) => {
    setActivityLog((prev) => [
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
      ...prev,
    ]);
  }, []);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const { wallets: turnkeyWallets } = await api.getWallets();
      
      // Get all addresses
      const allAddresses = turnkeyWallets.flatMap((w: Wallet) =>
        w.accounts.map((a) => a.address)
      );
      
      // Fetch balances
      let balanceMap: Record<string, Balance> = {};
      if (allAddresses.length > 0) {
        const { balances } = await api.getBalances(allAddresses);
        balanceMap = balances.reduce((acc, b) => {
          acc[b.address] = b;
          return acc;
        }, {} as Record<string, Balance>);
      }
      
      // Convert to MerchantWallet format
      const merchantWallets: MerchantWallet[] = turnkeyWallets.flatMap((w: Wallet) =>
        w.accounts.map((a) => ({
          uuid: w.walletId,
          address: a.address,
          balance: balanceMap[a.address]?.usdc || "0.00",
          ethBalance: balanceMap[a.address]?.eth || "0.00",
          walletName: w.walletName,
        }))
      );
      
      setWallets(merchantWallets);
    } catch (error: any) {
      console.error("Error fetching wallets:", error);
      toast.error(`Failed to fetch wallets: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const addWallet = (wallet: MerchantWallet) => {
    setWallets((prev) => [...prev, wallet]);
  };

  const updateWalletBalance = (address: string, newBalance: string) => {
    setWallets((prev) =>
      prev.map((w) => (w.address === address ? { ...w, balance: newBalance } : w))
    );
  };

  const refreshWallets = () => {
    fetchWallets();
  };

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Toaster position="top-right" />
      
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <ActionMenu
              onCreateWallet={() => setCreateWalletOpen(true)}
              onSweepAll={() => setSweepAllOpen(true)}
              onSweepSingle={() => setSweepSingleOpen(true)}
              onTestPolicyWeth={() => setTestPolicyWethOpen(true)}
              onTestPolicyWrongAddr={() => setTestPolicyWrongAddrOpen(true)}
            />
            <ActivityLog entries={activityLog} onClear={clearActivityLog} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1">
            <WalletOverview 
              wallets={wallets} 
              loading={loading}
              onRefresh={refreshWallets}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateWalletModal
        open={createWalletOpen}
        onOpenChange={setCreateWalletOpen}
        onWalletCreated={addWallet}
        onLogActivity={addActivityLog}
      />
      <SweepModal
        open={sweepAllOpen}
        onOpenChange={setSweepAllOpen}
        mode="all"
        wallets={wallets}
        onLogActivity={addActivityLog}
        onWalletBalanceUpdate={updateWalletBalance}
        onRefreshWallets={refreshWallets}
      />
      <SweepModal
        open={sweepSingleOpen}
        onOpenChange={setSweepSingleOpen}
        mode="single"
        wallets={wallets}
        onLogActivity={addActivityLog}
        onWalletBalanceUpdate={updateWalletBalance}
        onRefreshWallets={refreshWallets}
      />
      <TestPolicyModal
        open={testPolicyWethOpen}
        onOpenChange={setTestPolicyWethOpen}
        testType="weth"
        wallets={wallets}
        onLogActivity={addActivityLog}
      />
      <TestPolicyModal
        open={testPolicyWrongAddrOpen}
        onOpenChange={setTestPolicyWrongAddrOpen}
        testType="wrong-address"
        wallets={wallets}
        onLogActivity={addActivityLog}
      />
    </div>
  );
}
