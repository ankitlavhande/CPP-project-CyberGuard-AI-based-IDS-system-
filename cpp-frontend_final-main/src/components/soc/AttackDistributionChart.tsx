
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { BarChart3, Brain } from "lucide-react";
import { usePrediction } from "@/context/PredictionContext";

const COLORS = [
  "hsl(185 80% 45%)", "hsl(200 70% 50%)", "hsl(220 60% 55%)",
  "hsl(270 50% 55%)", "hsl(38 80% 50%)", "hsl(150 60% 42%)",
  "hsl(345 60% 50%)", "hsl(160 50% 45%)", "hsl(250 45% 50%)",
  "hsl(30 60% 48%)", "hsl(190 55% 48%)", "hsl(310 45% 50%)",
];

const PanelTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-4 py-3 text-xs shadow-lg space-y-1.5">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Count</span>
        <span className="font-mono font-medium text-foreground">{data.count}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Percentage</span>
        <span className="font-mono font-medium text-foreground">{data.pct}%</span>
      </div>
    </div>
  );
};

interface PanelProps {
  title: string;
  data: { name: string; count: number; pct: number }[];
  barSize?: number;
  height: number;
  colorMap: Record<string, string>;
}

function DistributionPanel({ title, data, barSize = 18, height, colorMap }: PanelProps) {
  return (
    <div className="glass-card p-5 space-y-4" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className="ai-badge">
          <Brain className="w-3 h-3" />
          LightGBM
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground) / 0.6)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground) / 0.6)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={130}
              tick={({ x, y, payload }: any) => {
                const item = data.find((d) => d.name === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={-4} y={0} dy={4} textAnchor="end" fill="hsl(var(--foreground) / 0.85)" fontSize={11}>
                      {payload.value}
                    </text>
                    <text x={-4} y={0} dy={16} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={10} fontFamily="JetBrains Mono, monospace">
                      {item?.pct}%
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip content={<PanelTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={barSize}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={colorMap[entry.name] || COLORS[0]} style={{ transition: "opacity 0.2s" }} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AttackDistributionChart() {
  const { attackCounts } = usePrediction();

  const entries = Object.entries(attackCounts);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);

  if (entries.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">No attack data yet. Run analyses to build the distribution.</p>
      </div>
    );
  }

  const enriched = entries
    .map(([name, count]) => ({ name, count, pct: +(count / total * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  const colorMap: Record<string, string> = {};
  enriched.forEach((d, i) => { colorMap[d.name] = COLORS[i % COLORS.length]; });

  const majorData = enriched.slice(0, 5);
  const minorData = enriched.slice(5);

  return (
    <div className="space-y-4">
      <DistributionPanel title="Major Attack Classes" data={majorData} barSize={20} height={Math.max(180, majorData.length * 52)} colorMap={colorMap} />
      {minorData.length > 0 && (
        <DistributionPanel title="Minor Attack Classes" data={minorData} barSize={14} height={Math.max(140, minorData.length * 44)} colorMap={colorMap} />
      )}
    </div>
  );
}
