import { Camera } from "lucide-react";
import { useApod } from "@/data/hooks/useExtraData";
import { Panel } from "@/components/ui/Panel";

export function ApodPanel() {
  const { data, loading } = useApod();

  if ((loading && !data) || !data) return null;

  return (
    <Panel title="Picture of the Day" icon={<Camera size={14} />} status="nominal" compact>
      <div className="space-y-2">
        {data.mediaType === "image" ? (
          <div className="relative overflow-hidden rounded">
            <img
              src={data.url}
              alt={data.title}
              className="w-full h-auto max-h-[180px] object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-video rounded overflow-hidden">
            <iframe
              src={data.url}
              title={data.title}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        )}
        <div>
          <h4 className="text-[9px] font-heading font-bold text-text-primary leading-tight">
            {data.title}
          </h4>
          <p className="text-[7px] font-mono text-text-muted mt-0.5 line-clamp-2">
            {data.explanation.slice(0, 150)}...
          </p>
        </div>
        <p className="text-[6px] font-mono text-text-muted/40">NASA APOD — {data.date}</p>
      </div>
    </Panel>
  );
}
