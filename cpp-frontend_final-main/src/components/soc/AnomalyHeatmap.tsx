import { usePrediction } from "@/context/PredictionContext";

export function AnomalyHeatmap() {
  const { attackCounts, totalAnalyzed } = usePrediction();

  const entries = Object.entries(attackCounts);

  if (!entries.length || totalAnalyzed === 0) {
    return (
      <div className="glass-card p-6 text-muted-foreground">
        No behavioral risk data available.
      </div>
    );
  }

  const sorted = entries.sort((a, b) => b[1] - a[1]);

  const maxValue = sorted[0][1];

  return (
    <div className="glass-card p-6">

      <h3 className="text-lg font-semibold text-primary mb-4">
        Behavioral Risk Heatmap
      </h3>

      <div className="space-y-3">

        {sorted.map(([label, value]) => {

          const percent =
            maxValue > 0
              ? (value / maxValue) * 100
              : 0;

          let color = "bg-green-500";

          if (percent > 70) color = "bg-red-500";
          else if (percent > 40) color = "bg-yellow-500";

          return (
            <div key={label}>

              <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span>{value}</span>
              </div>

              <div className="w-full h-3 bg-background/40 rounded">

                <div
                  className={`h-3 rounded ${color}`}
                  style={{
                    width: `${percent}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}