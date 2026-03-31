import React, { useState } from "react";
import { SOCSidebar } from "@/components/soc/SOCSidebar";
import { SOCHeader } from "@/components/soc/SOCHeader";
import { PredictionProvider } from "@/context/PredictionContext";

import DashboardPage from "@/pages/DashboardPage";
import PredictionsPage from "@/pages/PredictionsPage";
import ModelInsightsPage from "@/pages/ModelInsightsPage";
import LogsPage from "@/pages/LogsPage";
import ReportsPage from "@/pages/ReportsPage";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  const renderPage = () => {
    switch (activeNavItem) {
      case "predictions":
        return <PredictionsPage />;
      case "model-insights":
        return <ModelInsightsPage />;
      case "logs":
        return <LogsPage />;
      case "reports":
        return <ReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <PredictionProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden transition-all duration-300">
        <SOCSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeNavItem}
          onItemClick={setActiveNavItem}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <SOCHeader />
          {renderPage()}
        </div>
      </div>
    </PredictionProvider>
  );
};

export default Index;
