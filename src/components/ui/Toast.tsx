import { useDashboardStore } from "@/store/useDashboardStore";

export function Toast() {
  const { toastMessage, clearToast } = useDashboardStore();
  if (!toastMessage) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 bg-space-panel border border-amber/30 rounded-lg px-4 py-2.5
                 shadow-glow-amber motion-safe:animate-[fade-in_0.3s_ease-out]"
    >
      <div className="flex items-center gap-3">
        <span className="text-amber text-sm">&#9888;</span>
        <span className="text-text-primary text-xs font-mono">
          {toastMessage}
        </span>
        <button
          onClick={clearToast}
          className="text-text-muted hover:text-text-primary text-xs ml-2 cursor-pointer"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
