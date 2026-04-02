import { Image } from "lucide-react";
import { useNasaImages } from "@/data/hooks/useNasaImages";
import { Panel } from "@/components/ui/Panel";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";

interface ImageFeedProps {
  query: string;
}

export function ImageFeed({ query }: ImageFeedProps) {
  const { data, loading } = useNasaImages(query);

  if (loading && !data) return <PanelSkeleton lines={3} />;
  if (!data || data.length === 0) {
    return (
      <Panel title="Mission Images" icon={<Image size={14} />} status="idle">
        <p className="text-text-muted text-xs font-mono">No images available</p>
      </Panel>
    );
  }

  return (
    <Panel title="Mission Images" icon={<Image size={14} />} status="nominal">
      <div className="grid grid-cols-3 gap-1.5">
        {data.slice(0, 6).map((img) => (
          <a
            key={img.nasaId}
            href={img.fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded bg-space-surface"
          >
            <img
              src={img.thumbUrl}
              alt={img.title}
              loading="lazy"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white leading-tight line-clamp-2">
                {img.title}
              </p>
            </div>
          </a>
        ))}
      </div>
      <p className="text-[9px] text-text-muted mt-2 font-mono">
        Images: NASA
      </p>
    </Panel>
  );
}
