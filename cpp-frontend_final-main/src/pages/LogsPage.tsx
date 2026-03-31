import React from "react";
import { usePrediction } from "@/context/PredictionContext";
import { useMode } from "@/context/ModeContext";

const LogsPage = () => {

  const {
    detections,
    totalAnalyzed,
    attackCounts,
    isMonitoring,
  } = usePrediction();

  const { mode } = useMode();

  const totalLogs = detections.length;

  const errorLogs = detections.filter(
    d => d.severity === "critical"
  ).length;

  const systemLogs = detections.filter(
    d => d.severity !== "low"
  ).length;

  return (
    <main className="flex-1 p-8 overflow-y-auto space-y-6">

      <h2 className="text-2xl font-semibold tracking-wide">
        System Logs & Evidence
      </h2>


      {/* ===== SUMMARY ===== */}

      <div className="grid md:grid-cols-3 gap-6">

        <div className="glass-card p-6">
          <p className="text-muted-foreground text-sm">
            Total Events
          </p>
          <p className="text-3xl font-bold">
            {totalLogs}
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="text-muted-foreground text-sm">
            Threat Events
          </p>
          <p className="text-3xl font-bold text-primary">
            {systemLogs}
          </p>
        </div>

        <div className="glass-card p-6">
          <p className="text-muted-foreground text-sm">
            Critical Alerts
          </p>
          <p className="text-3xl font-bold text-red-400">
            {errorLogs}
          </p>
        </div>

      </div>


      {/* ===== GRID ===== */}

      <div className="grid lg:grid-cols-3 gap-6">


        {/* ===== LOG TABLE ===== */}

        <div className="lg:col-span-2 glass-card p-6 h-[500px] overflow-y-auto">

          {detections.length === 0 && (
            <p className="text-muted-foreground">
              No log activity yet.
            </p>
          )}

          {detections.map((d, i) => (

            <div
              key={i}
              className="flex justify-between items-center border-b border-primary/10 py-3"
            >

              <div className="flex items-center gap-4">

                <span
                  className={`text-xs px-2 py-1 rounded-full font-mono
                  ${d.severity === "low" && "bg-green-500/20 text-green-400"}
                  ${d.severity === "medium" && "bg-yellow-500/20 text-yellow-400"}
                  ${d.severity === "high" && "bg-orange-500/20 text-orange-400"}
                  ${d.severity === "critical" && "bg-red-500/20 text-red-400"}
                  `}
                >
                  {d.severity.toUpperCase()}
                </span>

                <div>
                  <p className="text-sm font-medium">
                    {d.type}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {mode.toUpperCase()} MODE
                  </p>

                </div>

              </div>

              <span className="text-xs text-muted-foreground font-mono">
                {d.timestamp}
              </span>

            </div>

          ))}

        </div>



        {/* ===== INCIDENT PANEL ===== */}

        <div className="glass-card p-6 space-y-4">

          <h3 className="text-lg font-semibold text-primary">
            Incident Overview
          </h3>


          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>Status</span>

              <span className="text-green-400 font-semibold">
                {mode === "live" && isMonitoring
                  ? "Live Monitoring"
                  : "Idle"}
              </span>

            </div>


            <div className="flex justify-between">
              <span>Total Flows</span>
              <span>{totalAnalyzed}</span>
            </div>


            <div className="flex justify-between">
              <span>Threat Activity</span>

              <span className="text-yellow-400">
                {systemLogs > 0
                  ? "Detected"
                  : "None"}
              </span>

            </div>


            <div className="flex justify-between">
              <span>Mode</span>
              <span>
                {mode.toUpperCase()}
              </span>
            </div>

          </div>

        </div>


      </div>

    </main>
  );
};

export default LogsPage;