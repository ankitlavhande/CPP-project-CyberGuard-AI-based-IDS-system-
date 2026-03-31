import { useEffect, useRef } from "react";
import { usePrediction } from "@/context/PredictionContext";

export function useLivePrediction() {
  const { isMonitoring, updateLiveStats } = usePrediction();

  const intervalRef = useRef<number | null>(null);
  const previousTotalRef = useRef<number>(0);

  useEffect(() => {
    // If monitoring is OFF → stop polling
    if (!isMonitoring) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      previousTotalRef.current = 0;
      return;
    }

    // Start polling ONLY when monitoring is true
    intervalRef.current = window.setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/live-status");
        if (!res.ok) return;

        const data = await res.json();

        const currentTotal = data.total_flows;

        // Update only when new traffic arrives
        if (currentTotal > previousTotalRef.current) {
          previousTotalRef.current = currentTotal;
          updateLiveStats(data);
        }
      } catch (err) {
        console.error("Live polling error:", err);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMonitoring, updateLiveStats]);
}