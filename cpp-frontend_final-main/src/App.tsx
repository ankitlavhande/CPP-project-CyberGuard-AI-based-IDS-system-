import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PredictionProvider } from "@/context/PredictionContext";
import { ModeProvider } from "@/context/ModeContext";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {

  useEffect(() => {
    fetch("http://127.0.0.1:8000/metrics")
      .then(res => res.json())
      .then(data => {
        console.log("Backend Response:", data);
      })
      .catch(err => {
        console.error("Connection error:", err);
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <PredictionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PredictionProvider>
      </ModeProvider>
    </QueryClientProvider>
  );
};

export default App;