import { useEffect, useState } from "react";
import { Shield, Activity, Wifi, WifiOff, Layers } from "lucide-react";
import { usePrediction } from "@/context/PredictionContext";

export function SOCHeader() {
  const { backendOnline, batchResult } = usePrediction();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const systemMode = batchResult ? "Analysis Complete" : "Idle";
  const totalFlows = batchResult?.total_flows ?? 0;

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-primary/30 bg-[hsl(220_25%_8%)]">

      {/* LEFT — Project Identity */}
      <div
        className="
          flex items-center gap-4
          px-6 py-3
          rounded-xl
          bg-gradient-to-r from-primary/10 to-cyan-400/5
          border border-primary/40
          shadow-[0_0_20px_rgba(0,255,255,0.15)]
          backdrop-blur-md
          transition-all duration-300
          hover:shadow-[0_0_30px_rgba(0,255,255,0.25)]
        "
      >
        <Shield className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.7)]" />

        <div className="flex flex-col leading-tight">
          <span className="text-xl font-semibold text-primary tracking-wide">
            AI CyberGuard
          </span>
          <span className="text-xs text-muted-foreground tracking-wider uppercase">
            Intelligent Intrusion Detection System
          </span>
        </div>
      </div>

      {/* RIGHT — Runtime System Info */}
      <div className="flex items-center gap-6">

        <div className="flex items-center gap-6 px-6 py-3 rounded-xl bg-background/40 border border-primary/20 shadow-inner">

          {/* System Mode */}
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">
              {systemMode}
            </span>
          </div>

          {/* Total Flows Processed */}
          <div className="flex items-center gap-2 text-foreground">
            <Layers className="w-4 h-4" />
            <span className="text-sm">
              Flows: {totalFlows}
            </span>
          </div>

          {/* Backend Status */}
          <div
            className={`flex items-center gap-2 text-sm ${
              backendOnline ? "text-success" : "text-destructive"
            }`}
          >
            {backendOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                Backend Online
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Backend Offline
              </>
            )}
          </div>
        </div>

        {/* Clock */}
        <div className="text-right leading-tight">
          <div className="text-sm font-mono text-foreground">
            {time.toLocaleTimeString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {time.toDateString()}
          </div>
        </div>
      </div>
    </header>
  );
}
