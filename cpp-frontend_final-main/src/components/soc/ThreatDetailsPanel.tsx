import { Clock, ShieldAlert, BarChart3, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThreatDetail {
  id: string;
  timestamp: string;
  predicted_class: string;
  confidence: number;
  probability_distribution: { class_name: string; probability: number }[];
  top_features: { name: string; value: string }[];
}

function getSeverity(confidence: number) {
  if (confidence > 70) return { label: "High", color: "text-destructive", barColor: "bg-destructive" };
  if (confidence >= 40) return { label: "Medium", color: "text-warning", barColor: "bg-warning" };
  return { label: "Low", color: "text-primary", barColor: "bg-primary" };
}

export function ThreatDetailsPanel({ threat }: { threat: ThreatDetail | null }) {
  if (!threat) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">
          Select a detection from the timeline above to view details.
        </p>
      </div>
    );
  }

  const severity = getSeverity(threat.confidence);
  const topProbs = [...threat.probability_distribution]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent">
          <ShieldAlert className="w-5 h-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Threat Details</h3>
          <p className="text-xs text-muted-foreground">Model prediction breakdown for {threat.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section A: Threat Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Threat Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Predicted Class</span>
              <span className="font-medium text-foreground">{threat.predicted_class}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-mono font-medium text-foreground">{threat.confidence.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Severity</span>
              <span className={cn("font-medium", severity.color)}>{severity.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timestamp</span>
              <span className="font-mono text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {threat.timestamp}
              </span>
            </div>
          </div>
        </div>

        {/* Section B: Probability Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" /> Probability Breakdown
          </h4>
          <div className="space-y-2.5">
            {topProbs.map((item) => (
              <div key={item.class_name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.class_name}</span>
                  <span className="font-mono text-foreground">{item.probability.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all duration-500"
                    style={{ width: `${item.probability}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Risk Score Bar */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prediction Probability
          </h4>
          <div className="space-y-1.5">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", severity.barColor)}
                style={{ width: `${threat.confidence}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className={cn("font-mono font-medium", severity.color)}>
                {threat.confidence.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Section D: Top Contributing Features */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Top Contributing Features
          </h4>
          <div className="divide-y divide-border/50">
            {threat.top_features.map((f, i) => (
              <div key={i} className="flex justify-between py-2 text-sm first:pt-0 last:pb-0">
                <span className="text-muted-foreground">{f.name}</span>
                <span className="font-mono text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
