import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, Trash2, AlertCircle } from "lucide-react";
import { ActivityLogEntry } from "../App";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  onClear?: () => void;
}

export function ActivityLog({ entries, onClear }: ActivityLogProps) {
  const getStatusIcon = (status: ActivityLogEntry["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="size-5 text-emerald-500" />;
      case "denied":
        return <XCircle className="size-5 text-red-500" />;
      case "error":
        return <AlertCircle className="size-5 text-orange-500" />;
      case "pending":
        return <Clock className="size-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = (status: ActivityLogEntry["status"]) => {
    switch (status) {
      case "success":
        return "✅ Success";
      case "denied":
        return "❌ Denied";
      case "error":
        return "⚠️ Error";
      case "pending":
        return "⏳ Pending";
    }
  };

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Activity Log</h2>
        {entries.length > 0 && onClear && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="h-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Trash2 className="size-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <ScrollArea className="h-[500px] pr-4">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock className="size-12 mx-auto mb-3 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm mt-1">Start by creating a merchant wallet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(entry.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-medium text-white">{entry.action}</h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{getStatusText(entry.status)}</p>
                    <p className="text-sm text-slate-300 break-all">{entry.details}</p>
                    {entry.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                      >
                        View on Etherscan
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
