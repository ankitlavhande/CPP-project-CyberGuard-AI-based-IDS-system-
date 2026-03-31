import { useState, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Brain, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "predictions", label: "Predictions", icon: Brain },
  { id: "model-insights", label: "Model Insights", icon: Activity },
  { id: "logs", label: "Logs & Evidence", icon: Database },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export function SOCSidebar({ collapsed, onToggle, activeItem, onItemClick }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-sm text-foreground">AI CyberGuard</span>
          </div>
        )}
        {collapsed && <Shield className="w-6 h-6 text-primary mx-auto" />}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-[hsl(220_20%_10%)] group",
                isActive 
                  ? "bg-sidebar-accent text-primary border border-primary/20" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-[hsl(190_30%_40%)]"
              )} />
              {!collapsed && (
                <span className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-glow-cyan" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
