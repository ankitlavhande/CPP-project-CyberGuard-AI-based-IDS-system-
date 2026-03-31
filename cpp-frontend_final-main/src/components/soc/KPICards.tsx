import {
  TrendingUp,
  TrendingDown,
  Brain,
  Cpu,
  Shield,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { usePrediction } from "@/context/PredictionContext";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: string | number;
  trend: { value: number; isUp: boolean };
  aiModel: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "critical" | "success";
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

function KPICard({
  title,
  value,
  trend,
  aiModel,
  icon,
  variant = "default",
  isLoading = false,
  hasError = false,
  errorMessage = "",
}: KPICardProps) {
  const variantStyles = {
    default: "glass-card-cyan",
    warning: "glass-card-amber",
    critical: "glass-card-red",
    success: "glass-card",
  };

  const iconColors = {
    default: "text-primary",
    warning: "text-warning",
    critical: "text-destructive",
    success: "text-success",
  };

  return (
    <div
      className={cn(
        "p-5 transition-all hover:scale-[1.02]",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-2.5 rounded-lg bg-background/50",
            iconColors[variant]
          )}
        >
          {icon}
        </div>

        <div className="ai-badge">
          <Brain className="w-3 h-3" />
          <span>AI</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">
          {title}
        </p>

        <div className="flex items-end gap-3">
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : hasError ? (
            <span className="text-sm text-muted-foreground">
              {errorMessage}
            </span>
          ) : (
            <>
              <span className="text-3xl font-bold font-mono">
                {value}
              </span>

              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium pb-1",
                  trend.isUp
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {trend.isUp ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}

                <span>{trend.value}%</span>
              </div>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Cpu className="w-3 h-3" />
          {aiModel}
        </div>
      </div>
    </div>
  );
}

export function KPICards() {
  const {
    totalAnalyzed,
    attackCounts,
    detections,
    modelMetrics,
    metricsLoading,
    metricsError,
  } = usePrediction();

  /* ---------- dynamic values ---------- */

  const benign = attackCounts["BENIGN"] ?? 0;

  const totalAttacks =
    Object.values(attackCounts).reduce(
      (a, b) => a + b,
      0
    ) - benign;

  const attackRate =
    totalAnalyzed > 0
      ? (totalAttacks / totalAnalyzed) * 100
      : 0;

  const highRisk = detections.filter(
    (d) =>
      d.severity === "high" ||
      d.severity === "critical"
  ).length;

  const weightedF1 =
    modelMetrics?.weighted_f1 ?? 0;

  const kpis = [
    {
      title: "Packets Analyzed",
      value: totalAnalyzed,
      trend: { value: 100, isUp: true },
      aiModel: "Live analysis via backend",
      icon: <Shield className="w-5 h-5" />,
      variant: "default" as const,
    },

    {
      title: "Intrusions Detected",
      value: totalAttacks,
      trend: {
        value: Number(attackRate.toFixed(2)),
        isUp: attackRate > 0,
      },
      aiModel: "Classified by LightGBM",
      icon: <AlertTriangle className="w-5 h-5" />,
      variant:
        attackRate > 30 ? "warning" : "default",
    },

    {
      title: "High-Risk Detections",
      value: highRisk,
      trend: {
        value: Number(attackRate.toFixed(2)),
        isUp: attackRate > 60,
      },
      aiModel: "Confidence > 70%",
      icon: <Brain className="w-5 h-5" />,
      variant:
        attackRate > 60 ? "critical" : "default",
    },

    {
      title: "Weighted F1 Score",
      value: weightedF1.toFixed(4),
      trend: {
        value: Number(
          (weightedF1 * 100).toFixed(2)
        ),
        isUp: true,
      },
      aiModel:
        modelMetrics?.dataset ??
        "Model metrics",
      icon: <Cpu className="w-5 h-5" />,
      variant: "success" as const,
      isLoading: metricsLoading,
      hasError: metricsError,
      errorMessage:
        "Model metrics unavailable",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  );
}