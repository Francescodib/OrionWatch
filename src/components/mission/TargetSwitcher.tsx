import { useTargetStore, ALL_TARGETS } from "@/store/useTargetStore";
import { Badge } from "@/components/ui/Badge";

export function TargetSwitcher() {
  const { activeTarget, setActiveTarget } = useTargetStore();

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-heading uppercase tracking-widest text-text-muted block mb-2">
        Mission Target
      </label>
      <select
        value={activeTarget.id}
        onChange={(e) => setActiveTarget(e.target.value)}
        className="w-full bg-space-surface border border-space-border rounded px-3 py-2
                   text-xs font-mono text-text-primary
                   focus:outline-none focus:border-cyan/40
                   cursor-pointer appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238899aa' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundPosition: "right 8px center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {ALL_TARGETS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="mt-2 flex items-center gap-2">
        <Badge
          variant={
            activeTarget.id === "demo"
              ? "demo"
              : activeTarget.active
                ? "live"
                : "historical"
          }
        >
          {activeTarget.id === "demo"
            ? "OFFLINE"
            : activeTarget.active
              ? "LIVE"
              : "HISTORICAL"}
        </Badge>
      </div>
    </div>
  );
}
