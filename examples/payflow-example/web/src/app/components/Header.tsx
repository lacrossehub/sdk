import { Wallet, Activity } from "lucide-react";
import { Badge } from "./ui/badge";

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Wallet className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Payflow</h1>
              <p className="text-sm text-slate-400">Merchant Payment Processing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-3 py-1">
              <Activity className="size-3 mr-1.5 animate-pulse" />
              Sepolia Testnet
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
