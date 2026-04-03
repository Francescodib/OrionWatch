import { Globe } from "lucide-react";
import { useEpic } from "@/data/hooks/useExtraData";
import { Panel } from "@/components/ui/Panel";

export function EpicEarth() {
  const { data, loading } = useEpic();

  if (loading && !data) return null; // Don't show skeleton — this is supplementary

  if (!data) return null;

  const dateStr = new Date(data.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Panel title="Earth from DSCOVR" icon={<Globe size={14} />} status="nominal" compact>
      <div className="space-y-2">
        <div className="relative aspect-square max-w-[200px] mx-auto overflow-hidden rounded">
          <img
            src={data.imageUrl}
            alt="Earth from DSCOVR EPIC camera"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-space-bg/80 to-transparent p-1.5">
            <span className="text-[9px] font-mono text-text-muted">{dateStr} UTC</span>
          </div>
        </div>
        <p className="text-[9px] font-mono text-text-muted/50 text-center">
          NASA EPIC / DSCOVR L1
        </p>
      </div>
    </Panel>
  );
}
