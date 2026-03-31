import React from "react";
import { usePrediction } from "@/context/PredictionContext";
import { useMode } from "@/context/ModeContext";

const PredictionsPage = () => {

  const {
    batchResult,
    liveResult,
    runAnalysis,
    isLoading,
  } = usePrediction();

  const { mode } = useMode();

  const activeResult =
    mode === "live"
      ? liveResult
      : batchResult;


  return (

    <main className="flex-1 p-6 space-y-8">

      <h2 className="text-xl font-semibold">
        Prediction Execution
      </h2>


      {/* ======================
         TOP PANEL
      ====================== */}

      <div className="glass-card p-6 space-y-4">

        {mode === "batch" ? (

          <>
            <p className="text-muted-foreground">
              Upload network traffic CSV for intrusion detection
            </p>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (
                  e.target.files &&
                  e.target.files[0]
                ) {
                  runAnalysis(
                    e.target.files[0]
                  );
                }
              }}
              className="text-sm"
            />

          </>

        ) : (

          <div className="space-y-2">

            <h3 className="text-primary font-semibold">
              Live Monitoring Active
            </h3>

            <p className="text-muted-foreground text-sm">
              Network packets are being captured in real-time.
              CSV prediction is disabled while live monitoring is running.
            </p>

            <p className="text-xs text-muted-foreground">
              Statistics update automatically.
            </p>

          </div>

        )}

        {isLoading && (
          <div className="text-primary">
            Running analysis...
          </div>
        )}

      </div>



      {/* ======================
         RESULT SECTION
      ====================== */}

      {activeResult && (

        <>

          {/* KPI */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="glass-card p-6">

              <p>Total Flows</p>

              <p className="text-3xl font-bold">
                {activeResult.total_flows}
              </p>

            </div>


            <div className="glass-card p-6">

              <p>Attacks Detected</p>

              <p className="text-3xl font-bold text-destructive">
                {activeResult.attacks_detected}
              </p>

            </div>


            <div className="glass-card p-6">

              <p>Attack Rate</p>

              <p className="text-3xl font-bold">
                {activeResult.attack_rate.toFixed(2)}%
              </p>

            </div>

          </div>



          {/* TABLE */}

          <div className="glass-card p-6 space-y-4">

            <h3 className="text-lg font-semibold">
              Attack Class Breakdown
            </h3>

            <div className="overflow-x-auto">

              <table className="w-full text-sm text-left border-collapse">

                <thead className="text-muted-foreground border-b">

                  <tr>

                    <th className="py-2">
                      Attack Type
                    </th>

                    <th className="py-2 text-right">
                      Flow Count
                    </th>

                    <th className="py-2 text-right">
                      Percentage
                    </th>

                    <th className="py-2 text-right">
                      Threat Level
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {Object.entries(
                    activeResult.distribution
                  )
                    .sort(
                      (a, b) => b[1] - a[1]
                    )
                    .map(
                      ([label, count]) => {

                        const percentage =
                          (
                            (count /
                              activeResult.total_flows) *
                            100
                          ).toFixed(2);

                        let threat =
                          "Low";

                        let threatColor =
                          "text-green-400";


                        if (
                          label ===
                          "BENIGN"
                        ) {
                          threat =
                            "Safe";
                          threatColor =
                            "text-green-400";
                        }

                        else if (
                          Number(
                            percentage
                          ) > 40
                        ) {
                          threat =
                            "High";
                          threatColor =
                            "text-red-400";
                        }

                        else if (
                          Number(
                            percentage
                          ) > 15
                        ) {
                          threat =
                            "Medium";
                          threatColor =
                            "text-yellow-400";
                        }


                        return (

                          <tr
                            key={
                              label
                            }
                            className="border-b border-border/40"
                          >

                            <td className="py-3 font-medium">
                              {
                                label
                              }
                            </td>

                            <td className="py-3 text-right font-mono">
                              {
                                count
                              }
                            </td>

                            <td className="py-3 text-right">
                              {
                                percentage
                              }
                              %
                            </td>

                            <td
                              className={`py-3 text-right font-semibold ${threatColor}`}
                            >
                              {
                                threat
                              }
                            </td>

                          </tr>

                        );

                      }
                    )}

                </tbody>

              </table>

            </div>

          </div>

        </>

      )}

    </main>

  );

};

export default PredictionsPage;