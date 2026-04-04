import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { PanelGrid } from "./PanelGrid";
import { BottomBar } from "./BottomBar";
import { Toast } from "@/components/ui/Toast";
import { TelemetryProvider } from "@/components/telemetry/TelemetryProvider";

export function DashboardLayout() {

  return (
    <div className="h-full flex flex-col bg-space-bg">
      <TelemetryProvider />
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <PanelGrid />
      </div>
      <BottomBar />
      <Toast />
    </div>
  );
}
