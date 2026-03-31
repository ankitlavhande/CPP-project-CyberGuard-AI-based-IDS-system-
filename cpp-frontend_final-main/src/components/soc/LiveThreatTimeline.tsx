import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrediction, type Detection } from "@/context/PredictionContext";

const severityStyles = {
  critical: { bg: "bg-destructive/20", border: "border-destructive/50", dot: "bg-destructive", text: "text-destructive" },
  high: { bg: "bg-warning/20", border: "border-warning/50", dot: "bg-warning", text: "text-warning" },
  medium: { bg: "bg-primary/20", border: "border-primary/50", dot: "bg-primary", text: "text-primary" },
  low: { bg: "bg-muted", border: "border-border", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

interface Props {
  selectedId: string | null;
  onSelect: (detection: Detection) => void;
}

export function LiveThreatTimeline({ selectedId, onSelect }: Props) {
  const { detections } = usePrediction();

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Activity className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Detection Timeline</h3>
            <p className="text-xs text-muted-foreground">LightGBM classification results</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-dot-active" />
          <span className="text-xs text-success font-medium">Live</span>
        </div>
      </div>

      {detections.length === 0 ? (
        <div className="flex items-center justify-center min-h-[120px]">
          <p className="text-sm text-muted-foreground">No detections yet. Run an analysis to populate the timeline.</p>
        </div>
      ) : (
        <div className="relative space-y-3 max-h-[400px] overflow-y-auto pr-1">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-destructive via-warning to-primary opacity-30" />

          {detections.map((det) => {
            const s = severityStyles[det.severity];
            const isSelected = selectedId === det.id;

            return (
              <div
                key={det.id}
                className={cn("relative pl-10 transition-all duration-200 cursor-pointer", isSelected && "scale-[1.01]")}
                onClick={() => onSelect(det)}
              >
                <div className={cn("absolute left-3 top-3 w-3.5 h-3.5 rounded-full border-2 border-background", s.dot, det.severity === "critical" && "animate-pulse")} />

                <div className={cn("p-4 rounded-lg border transition-all duration-200", s.bg, s.border, isSelected && "ring-1 ring-primary/40")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-sm font-semibold", s.text)}>{det.type}</span>
                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium uppercase", s.bg, s.text)}>
                          {det.severity}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Confidence: {det.confidence.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">{det.timestamp}</span>
                      </div>
                      <div className="text-xs font-mono text-primary">ID: {det.id}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
