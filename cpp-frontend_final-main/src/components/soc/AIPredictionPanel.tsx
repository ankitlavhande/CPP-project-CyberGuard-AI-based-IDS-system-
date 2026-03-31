import { Brain, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrediction } from "@/context/PredictionContext";

export function AIPredictionPanel() {
  const { batchResult, isLoading } = usePrediction();

  const confidence = batchResult?.attack_rate ?? 0;
  const hasData = batchResult !== null;

  const getRiskLabel = (c: number) => {
    if (c > 70) return "High";
    if (c >= 40) return "Medium";
    if (c >= 10) return "Low";
    return "Very Low";
  };

  const getRiskColor = (c: number) => {
    if (c > 70) return "critical";
    if (c >= 40) return "warning";
    return "success";
  };

  const riskColor = getRiskColor(confidence);

  const circumference = 351.86; // 2πr where r=56

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Prediction Summary
            </h3>
            <p className="text-xs text-muted-foreground">
              LightGBM batch risk evaluation
            </p>
          </div>
        </div>

        <div className="ai-badge">
          <Zap className="w-3 h-3" />
          LightGBM
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Meter */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Risk Level
          </h4>

          <div className="relative">
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full risk-gradient transition-all duration-1000"
                style={{ width: `${confidence}%` }}
              />
            </div>

            {hasData && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 bg-white rounded-sm shadow-lg border-2 border-background transition-all duration-1000"
                style={{ left: `calc(${confidence}% - 8px)` }}
              />
            )}
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-success font-medium">Low</span>
            <span className="text-warning font-medium">Medium</span>
            <span className="text-destructive font-medium">High</span>
          </div>

          {hasData && (
            <p className="text-xs text-muted-foreground">
              Current risk:{" "}
              <span
                className={cn(
                  "font-semibold",
                  riskColor === "critical"
                    ? "text-destructive"
                    : riskColor === "warning"
                    ? "text-warning"
                    : "text-success"
                )}
              >
                {getRiskLabel(confidence)}
              </span>
            </p>
          )}
        </div>

        {/* Attack Probability Gauge */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Attack Probability
          </h4>

          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />

              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={
                  riskColor === "critical"
                    ? "hsl(var(--cyber-red))"
                    : riskColor === "warning"
                    ? "hsl(var(--cyber-amber))"
                    : "hsl(var(--cyber-green))"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (circumference * confidence) / 100
                }
                className="transition-all duration-1000"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-mono">
                {hasData ? `${confidence.toFixed(1)}%` : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                Confidence
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!hasData && !isLoading && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              No batch analysis performed yet. Upload a CSV file in the
              Predictions tab to evaluate network traffic.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running analysis...
        </div>
      )}
    </div>
  );
}
