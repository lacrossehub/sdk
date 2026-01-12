import { Card } from "../components/ui/card";
import { Play } from "lucide-react";

export function VideoDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Play className="size-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Video Demo</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Watch a complete walkthrough of the Payflow merchant payment processing system, 
            including wallet creation, USDC sweeping, and policy enforcement.
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
          <div style={{ position: "relative", paddingBottom: "55.27123848515865%", height: 0 }}>
            <iframe
              src="https://www.loom.com/embed/54e0cf59d28c4cea8de36c2a02c42b0f"
              frameBorder="0"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Demo recorded using Loom • January 2026
          </p>
        </div>
      </div>
    </div>
  );
}

