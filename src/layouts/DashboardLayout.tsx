import { useEffect } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { PanelGrid } from "./PanelGrid";
import { BottomBar } from "./BottomBar";
import { Toast } from "@/components/ui/Toast";
import { TelemetryProvider } from "@/components/telemetry/TelemetryProvider";
import { useDashboardStore } from "@/store/useDashboardStore";

export function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen } = useDashboardStore();

  useEffect(() => {
    if (window.innerWidth < 640) setSidebarOpen(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-space-bg">
      <TelemetryProvider />
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar />
        <PanelGrid />
      </div>
      <BottomBar />
      <Toast />
    </div>
  );
}
