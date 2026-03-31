import { useLivePrediction } from "@/hooks/useLivePrediction";
import React, { useState } from "react";
import { KPICards } from "@/components/soc/KPICards";
import { AIPredictionPanel } from "@/components/soc/AIPredictionPanel";
import { LiveThreatTimeline } from "@/components/soc/LiveThreatTimeline";
import { ThreatDetailsPanel } from "@/components/soc/ThreatDetailsPanel";
import { AttackDistributionChart } from "@/components/soc/AttackDistributionChart";
import { AnomalyHeatmap } from "@/components/soc/AnomalyHeatmap";
import { usePrediction, type Detection } from "@/context/PredictionContext";
import { useMode } from "@/context/ModeContext";
import ModeToggle from "@/context/ModeToggle";

const DashboardPage = () => {
  useLivePrediction();

  const [selectedDetection, setSelectedDetection] =
    useState<Detection | null>(null);

  const {
    batchResult,
    attackCounts,
    totalAnalyzed,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  } = usePrediction();

  const { mode } = useMode();

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-8 grid-pattern">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">
          AI CyberGuard Dashboard
        </h1>
        <ModeToggle />
      </div>

      <KPICards />

      {/* LIVE CONTROL */}
      {mode === "live" && (
        <div className="glass-card p-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Live Monitoring Control
          </span>

          {!isMonitoring ? (
            <button
              onClick={startMonitoring}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition"
            >
              🟢 Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
            >
              🔴 Stop Monitoring
            </button>
          )}
        </div>
      )}

      {/* Upload panel only in batch */}
      {mode === "batch" && <AIPredictionPanel />}

      {/* ===== MAIN GRID ===== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="space-y-6">

          {/* Timeline in BOTH modes */}
          <LiveThreatTimeline
            selectedId={selectedDetection?.id ?? null}
            onSelect={setSelectedDetection}
          />

          {/* Details in BOTH modes */}
          {selectedDetection && (
            <ThreatDetailsPanel
              threat={{
                id: selectedDetection.id,
                timestamp: selectedDetection.timestamp,
                predicted_class: selectedDetection.type,
                confidence: selectedDetection.confidence,
                probability_distribution: [
                  {
                    class_name: selectedDetection.type,
                    probability: selectedDetection.confidence,
                  },
                ],
                top_features: [
                  {
                    name: "Confidence Score",
                    value: `${selectedDetection.confidence.toFixed(1)}%`,
                  },
                  {
                    name: "Severity",
                    value: selectedDetection.severity.toUpperCase(),
                  },
                  {
                    name: "Detection ID",
                    value: selectedDetection.id,
                  },
                ],
              }}
            />
          )}

        </div>

        <AttackDistributionChart />

      </div>


      {/* ===== SUMMARY PANEL (dynamic) ===== */}

      {mode === "batch" && batchResult && (() => {

        const sorted = Object.entries(batchResult.distribution)
          .sort((a, b) => b[1] - a[1]);

        const [dominantClass, dominantCount] = sorted[0];

        const dominantPercentage = (
          (dominantCount / batchResult.total_flows) * 100
        ).toFixed(2);

        let severity = "LOW";
        let severityColor = "text-green-400";

        if (batchResult.attack_rate > 50) {
          severity = "CRITICAL";
          severityColor = "text-red-400";
        } else if (batchResult.attack_rate > 20) {
          severity = "ELEVATED";
          severityColor = "text-yellow-400";
        }

        return (
          <div className="glass-card p-6 border border-primary/20">

            <h3 className="text-lg font-semibold text-primary">
              Threat Intelligence Summary (Batch)
            </h3>

            <p className="text-sm mt-3">
              Dominant class:
              <span className="text-primary font-semibold">
                {" "}
                {dominantClass}
              </span>
              {" "}({dominantPercentage}%)
            </p>

            <p className="text-sm mt-2">
              Intrusions:
              <span className="text-red-400 font-semibold">
                {" "}
                {batchResult.attacks_detected}
              </span>
              {" / "}
              {batchResult.total_flows}
            </p>

            <p className="mt-3">
              Threat Level:
              <span className={`ml-2 font-bold ${severityColor}`}>
                {severity}
              </span>
            </p>

          </div>
        );

      })()}



      {mode === "live" && (() => {

        const entries = Object.entries(attackCounts);

        if (!entries.length) {
          return (
            <div className="glass-card p-6 text-muted-foreground">
              No live traffic data yet.
            </div>
          );
        }

        const sorted = entries.sort((a, b) => b[1] - a[1]);

        const [dominantClass, dominantCount] = sorted[0];

        const percentage = (
          (dominantCount / totalAnalyzed) * 100
        ).toFixed(2);

        return (

          <div className="glass-card p-6 border border-primary/20">

            <h3 className="text-lg font-semibold text-primary">
              Threat Intelligence Summary (Live)
            </h3>

            <p className="text-sm mt-3">
              Dominant class:
              <span className="text-primary font-semibold">
                {" "}
                {dominantClass}
              </span>
              {" "}({percentage}%)
            </p>

            <p className="text-sm mt-2">
              Total flows:
              <span className="text-primary font-semibold">
                {" "}
                {totalAnalyzed}
              </span>
            </p>

          </div>

        );

      })()}


      {mode === "batch" && <AnomalyHeatmap />}

    </main>
  );
};

export default DashboardPage;