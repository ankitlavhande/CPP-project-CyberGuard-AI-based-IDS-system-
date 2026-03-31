import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { useMode } from "@/context/ModeContext";

/* ===============================
   TYPES
================================ */

export interface Detection {
  id: string;
  timestamp: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
}

export interface ModelMetrics {
  accuracy: number;
  weighted_f1: number;
  macro_f1: number;
  precision: number;
  recall: number;
  model: string;
  dataset: string;
}

export interface BatchResult {
  total_flows: number;
  attacks_detected: number;
  attack_rate: number;
  distribution: Record<string, number>;
}

interface PredictionState {
  detections: Detection[];
  totalAnalyzed: number;
  backendOnline: boolean;
  isLoading: boolean;

  modelMetrics: ModelMetrics | null;
  metricsLoading: boolean;
  metricsError: boolean;

  batchResult: BatchResult | null;
  liveResult: BatchResult | null;

  attackCounts: Record<string, number>;

  isMonitoring: boolean;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;

  runAnalysis: (file: File) => Promise<void>;
  clearAllState: () => void;
  updateLiveStats: (data: any) => void;
}

const PredictionContext = createContext<PredictionState | null>(null);

export function PredictionProvider({ children }: { children: ReactNode }) {

  const { mode } = useMode();

  // LIVE
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const [liveResult, setLiveResult] = useState<BatchResult | null>(null);

  // BATCH
  const [batchDetections, setBatchDetections] = useState<Detection[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCounts, setBatchCounts] = useState<Record<string, number>>({});
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  // COMMON
  const [backendOnline, setBackendOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [modelMetrics, setModelMetrics] =
    useState<ModelMetrics | null>(null);

  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);

  const [isMonitoring, setIsMonitoring] = useState(false);

  const detectionCounter = useRef(0);

  // MODE VALUES

  const detections =
    mode === "live" ? liveDetections : batchDetections;

  const totalAnalyzed =
    mode === "live" ? liveTotal : batchTotal;

  const attackCounts =
    mode === "live" ? liveCounts : batchCounts;


  // AUTO STOP

  useEffect(() => {
    if (mode === "batch" && isMonitoring) {
      stopMonitoring();
    }
  }, [mode]);


  // METRICS

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/metrics"
        );

        const data = await res.json();

        setModelMetrics(data);
        setBackendOnline(true);

      } catch {
        setBackendOnline(false);
        setMetricsError(true);

      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, []);


  // START

  const startMonitoring = useCallback(async () => {

    await fetch(
      "http://127.0.0.1:8000/start-live",
      { method: "POST" }
    );

    setIsMonitoring(true);

  }, []);


  // STOP (do NOT clear logs)

  const stopMonitoring = useCallback(async () => {

    await fetch(
      "http://127.0.0.1:8000/stop-live",
      { method: "POST" }
    );

    setIsMonitoring(false);

  }, []);


  // CLEAR

  const clearAllState = useCallback(() => {

    setLiveDetections([]);
    setBatchDetections([]);

    setLiveTotal(0);
    setBatchTotal(0);

    setLiveCounts({});
    setBatchCounts({});

    setBatchResult(null);
    setLiveResult(null);

    detectionCounter.current = 0;

  }, []);


  // LIVE

  const updateLiveStats = useCallback((data: any) => {

    const total = Number(data.total_flows || 0);
    const attacks = Number(data.attack_count || 0);
    const distribution = data.distribution || {};

    setLiveTotal(total);
    setLiveCounts(distribution);

    const rate =
      total > 0
        ? Number(((attacks / total) * 100).toFixed(2))
        : 0;

    setLiveResult({
      total_flows: total,
      attacks_detected: attacks,
      attack_rate: rate,
      distribution: distribution,
    });

    if (data.last_prediction) {

      detectionCounter.current++;

      const newDetection: Detection = {
        id: `LIVE-${detectionCounter.current}`,
        timestamp: new Date().toLocaleTimeString(),
        type: data.last_prediction,
        severity:
          data.last_prediction === "BENIGN"
            ? "low"
            : "high",
        confidence: 90,
      };

      setLiveDetections((prev) => [
        newDetection,
        ...prev,
      ]);
    }

  }, []);


  // BATCH  ✅ FIX HERE

  const runAnalysis = useCallback(
    async (file: File) => {

      if (!file) return;

      setIsLoading(true);

      try {

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          "http://127.0.0.1:8000/predict-batch",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        const safe: BatchResult = {
          total_flows: data.total_flows,
          attacks_detected: data.attacks_detected ?? 0,
          attack_rate: data.attack_rate,
          distribution: data.distribution ?? {},
        };

        setBatchResult(safe);
        setBatchCounts(safe.distribution);
        setBatchTotal(safe.total_flows);

        // ✅ ADD LOG ENTRY

        detectionCounter.current++;

        const newDetection: Detection = {
          id: `BATCH-${detectionCounter.current}`,
          timestamp: new Date().toLocaleTimeString(),
          type: "Batch Analysis",
          severity:
            safe.attack_rate > 50
              ? "critical"
              : safe.attack_rate > 20
              ? "high"
              : "medium",
          confidence: safe.attack_rate,
        };

        setBatchDetections(prev => [
          newDetection,
          ...prev,
        ]);

      } finally {
        setIsLoading(false);
      }
    },
    []
  );


  return (

    <PredictionContext.Provider
      value={{
        detections,
        totalAnalyzed,
        backendOnline,
        isLoading,
        modelMetrics,
        metricsLoading,
        metricsError,
        batchResult,
        liveResult,
        attackCounts,
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        runAnalysis,
        clearAllState,
        updateLiveStats,
      }}
    >

      {children}

    </PredictionContext.Provider>

  );
}


export function usePrediction() {

  const ctx = useContext(PredictionContext);

  if (!ctx) {
    throw new Error(
      "usePrediction must be used within provider"
    );
  }

  return ctx;
}