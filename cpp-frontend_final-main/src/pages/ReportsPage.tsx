import React from "react";
import { usePrediction } from "@/context/PredictionContext";
import { useMode } from "@/context/ModeContext";
import { FileText } from "lucide-react";

const ReportsPage = () => {

  const {
    batchResult,
    liveResult,
    modelMetrics,
  } = usePrediction();

  const { mode } = useMode();

  const activeResult =
    mode === "live" ? liveResult : batchResult;

  const downloadReport = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/generate-report"
      );

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "CyberGuard_Incident_Report.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const reportTimestamp = new Date().toLocaleString();

  return (
    <main className="flex-1 p-8 space-y-8 overflow-y-auto">

      {/* HEADER */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-wide">
          Incident Report Center
        </h2>

        <p className="text-muted-foreground text-sm">
          Generate formal cybersecurity incident documentation based on latest traffic analysis.
        </p>

        {/* ✅ show mode */}
        <p className="text-xs text-primary">
          Current Mode: {mode?.toUpperCase()}
        </p>
      </div>


      {/* INCIDENT OVERVIEW */}
      <div className="glass-card p-8 space-y-6 border border-primary/20 shadow-[0_0_20px_rgba(0,255,255,0.15)]">

        <h3 className="text-xl font-semibold text-primary">
          Latest Incident Overview
        </h3>

        {!activeResult ? (

          <div className="text-muted-foreground">
            No analysis available yet.
          </div>

        ) : (

          <div className="grid md:grid-cols-3 gap-8">

            <div>
              <p className="text-muted-foreground text-sm">
                Total Network Flows
              </p>

              <p className="text-3xl font-mono font-bold">
                {activeResult.total_flows}
              </p>
            </div>


            <div>
              <p className="text-muted-foreground text-sm">
                Intrusions Detected
              </p>

              <p className="text-3xl font-mono font-bold text-destructive">
                {activeResult.attacks_detected}
              </p>
            </div>


            <div>
              <p className="text-muted-foreground text-sm">
                Attack Rate
              </p>

              <p className="text-3xl font-mono font-bold">
                {activeResult.attack_rate}%
              </p>
            </div>

          </div>

        )}

      </div>


      {/* THREAT DISTRIBUTION */}
      {activeResult && (

        <div className="glass-card p-8 space-y-6 border border-primary/20">

          <h3 className="text-xl font-semibold text-primary">
            Threat Distribution Snapshot
          </h3>

          <div className="overflow-x-auto">

            <table className="w-full text-sm border-collapse">

              <thead className="border-b border-border/40 text-muted-foreground">

                <tr>
                  <th className="py-3 text-left">
                    Threat Category
                  </th>

                  <th className="py-3 text-right">
                    Flow Count
                  </th>

                  <th className="py-3 text-right">
                    Percentage
                  </th>
                </tr>

              </thead>

              <tbody>

                {Object.entries(
                  activeResult.distribution
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, count]) => {

                    const percentage = (
                      (count / activeResult.total_flows) *
                      100
                    ).toFixed(2);

                    return (

                      <tr
                        key={label}
                        className="border-b border-border/20"
                      >

                        <td className="py-3 font-medium">
                          {label}
                        </td>

                        <td className="py-3 text-right font-mono">
                          {count}
                        </td>

                        <td className="py-3 text-right">
                          {percentage}%
                        </td>

                      </tr>

                    );
                  })}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* METADATA */}
      <div className="glass-card p-8 space-y-4 border border-primary/20">

        <h3 className="text-xl font-semibold text-primary">
          Report Metadata
        </h3>

        <div className="text-sm text-muted-foreground space-y-2">

          <p>
            <span className="text-foreground font-semibold">
              Generated On:
            </span>{" "}
            {reportTimestamp}
          </p>

          <p>
            <span className="text-foreground font-semibold">
              System:
            </span>{" "}
            CyberGuard AI IDS
          </p>

          <p>
            <span className="text-foreground font-semibold">
              Model:
            </span>{" "}
            LightGBM (Multiclass Classification)
          </p>

          <p>
            <span className="text-foreground font-semibold">
              Mode:
            </span>{" "}
            {mode}
          </p>

        </div>

      </div>


      {/* EXPORT */}
      <div className="glass-card p-8 space-y-6 border border-primary/20">

        <h3 className="text-xl font-semibold text-primary">
          Export Official Report
        </h3>

        <p className="text-muted-foreground text-sm">
          Download a structured PDF document containing executive summary,
          threat distribution and forensic-level statistics.
        </p>


        <button
          onClick={downloadReport}
          disabled={!activeResult}
          className="
          inline-flex items-center gap-2
          px-6 py-3
          rounded-lg
          border border-primary/40
          bg-primary/5
          text-primary
          font-semibold
          transition-all duration-300
          hover:bg-primary/10
          hover:border-primary/60
          hover:shadow-[0_0_18px_rgba(0,255,255,0.25)]
          active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed
        "
        >

          <FileText className="w-4 h-4" />

          Download PDF Incident Report

        </button>

      </div>

    </main>
  );
};

export default ReportsPage;