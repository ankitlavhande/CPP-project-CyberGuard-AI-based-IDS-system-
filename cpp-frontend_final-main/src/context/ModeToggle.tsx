import { useMode } from "../context/ModeContext";

export default function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700 w-fit">
      <button
        onClick={() => setMode("live")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === "live"
            ? "bg-green-600 text-white shadow-md"
            : "text-gray-400 hover:text-white"
        }`}
      >
        LIVE
      </button>

      <button
        onClick={() => setMode("batch")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          mode === "batch"
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-400 hover:text-white"
        }`}
      >
        BATCH
      </button>
    </div>
  );
}