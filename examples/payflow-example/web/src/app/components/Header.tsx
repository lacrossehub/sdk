import { Wallet, Activity, Play, FileText, Github } from "lucide-react";
import { Badge } from "./ui/badge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "./ui/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: Wallet },
  { to: "/demo", label: "Video Demo", icon: Play },
  { to: "/readout", label: "Readout", icon: FileText },
  { to: "/github", label: "GitHub", icon: Github },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Wallet className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Payflow</h1>
                <p className="text-xs text-slate-400">Merchant Payments</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 px-3 py-1">
              <Activity className="size-3 mr-1.5 animate-pulse" />
              Sepolia
            </Badge>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="flex md:hidden items-center gap-1 mt-4 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
