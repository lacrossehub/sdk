import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Ban } from "lucide-react";
import { ActivityLogEntry, MerchantWallet } from "../App";
import { toast } from "sonner";
import { api } from "../api";

type TestType = "weth" | "wrong-address";

interface TestPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType: TestType;
  wallets: MerchantWallet[];
  onLogActivity: (entry: Omit<ActivityLogEntry, "id" | "timestamp">) => void;
}

const OMNIBUS_ADDRESS = "0x99534f20e524954147373ff3a1a0a38ff7442662";
const WRONG_ADDRESS = "0x000000000000000000000000000000000000dEaD";

const TEST_CONFIG = {
  weth: {
    title: "Test: Wrong Token (WETH)",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    description: "This test attempts to send WETH to the omnibus wallet. The policy should DENY this because only USDC transfers are allowed.",
    tokenLabel: "WETH (not allowed by policy)",
    destination: OMNIBUS_ADDRESS,
    balanceNote: "The wallet needs WETH balance. Wrap some ETH to WETH on Sepolia first.",
    actionLabel: "Test: Wrong Token",
    buttonColor: "from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400",
  },
  "wrong-address": {
    title: "Test: Wrong Destination",
    icon: Ban,
    iconColor: "text-red-500",
    description: "This test attempts to send USDC to a non-omnibus address (burn address). The policy should DENY this because only transfers to the omnibus are allowed.",
    tokenLabel: "USDC (correct token)",
    destination: WRONG_ADDRESS,
    balanceNote: "The wallet needs USDC balance to run this test.",
    actionLabel: "Test: Wrong Address",
    buttonColor: "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400",
  },
};

export function TestPolicyModal({
  open,
  onOpenChange,
  testType,
  wallets,
  onLogActivity,
}: TestPolicyModalProps) {
  const [testing, setTesting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [result, setResult] = useState<{
    tested: boolean;
    denied: boolean;
    message: string;
  } | null>(null);

  const config = TEST_CONFIG[testType];
  const Icon = config.icon;

  const handleTest = async () => {
    if (!selectedAddress) {
      toast.error("Please select a wallet address");
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = testType === "weth"
        ? await api.testPolicyDenial(selectedAddress)
        : await api.testPolicyDenialWrongAddress(selectedAddress);

      if (response.denied) {
        // Expected: policy correctly denied the transaction
        setResult({
          tested: true,
          denied: true,
          message: response.message || "Transaction was correctly blocked by policy",
        });

        const actionName = testType === "weth" ? "Test: Wrong Token (WETH)" : "Test: Wrong Address";
        const detailMsg = testType === "weth"
          ? `WETH transfer from ${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)} was correctly DENIED by policy`
          : `USDC transfer to wrong address from ${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-4)} was correctly DENIED by policy`;

        onLogActivity({
          action: actionName,
          status: "denied",
          details: detailMsg,
        });

        toast.success("Policy test passed! Transaction was denied as expected.");
      } else {
        // Unexpected: transaction was signed (policy not working)
        setResult({
          tested: true,
          denied: false,
          message: response.error || "Transaction was NOT blocked - policy may be misconfigured",
        });

        const actionName = testType === "weth" ? "Test: Wrong Token (WETH)" : "Test: Wrong Address";
        const detailMsg = testType === "weth"
          ? "WARNING: WETH transfer was NOT blocked. Policy may not be configured correctly."
          : "WARNING: USDC to wrong address was NOT blocked. Policy may not be configured correctly.";

        onLogActivity({
          action: actionName,
          status: "error",
          details: detailMsg,
        });

        toast.error("Policy test failed - transaction was not blocked!");
      }
    } catch (error: any) {
      setResult({
        tested: true,
        denied: false,
        message: error.message,
      });

      onLogActivity({
        action: config.actionLabel,
        status: "error",
        details: `Policy test error: ${error.message}`,
      });

      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedAddress("");
    onOpenChange(false);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Icon className={`size-5 ${config.iconColor}`} />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${
            testType === "weth" 
              ? "bg-amber-900/20 border-amber-500/30" 
              : "bg-red-900/20 border-red-500/30"
          }`}>
            <p className={`text-sm ${testType === "weth" ? "text-amber-300" : "text-red-300"}`}>
              ⚠️ {config.description}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select Wallet to Test</label>
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
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              {config.balanceNote}
            </p>
          </div>

          <div className="p-3 bg-slate-800/50 rounded border border-slate-700 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Token:</span>
              <span className="text-white font-medium">{config.tokenLabel}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Destination:</span>
              <code className={`text-xs ${testType === "wrong-address" ? "text-red-400" : "text-slate-300"}`}>
                {truncateAddress(config.destination)}
                {testType === "wrong-address" && " (burn addr)"}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expected Result:</span>
              <span className="text-red-400 font-medium">❌ DENIED</span>
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.denied
                  ? "bg-emerald-900/20 border-emerald-500/30"
                  : "bg-red-900/20 border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.denied ? (
                  <>
                    <CheckCircle className="size-5 text-emerald-400" />
                    <span className="font-semibold text-emerald-300">Policy Working Correctly</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-5 text-red-400" />
                    <span className="font-semibold text-red-300">Policy Check Failed</span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-300">{result.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-slate-700"
              disabled={testing}
            >
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                onClick={handleTest}
                disabled={testing || !selectedAddress}
                className={`flex-1 bg-gradient-to-r ${config.buttonColor}`}
              >
                {testing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Run Test"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
