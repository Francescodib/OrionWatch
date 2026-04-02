import { Newspaper } from "lucide-react";
import { useMissionBlog } from "@/data/hooks/useMissionBlog";
import { Panel } from "@/components/ui/Panel";
import { PanelSkeleton } from "@/components/ui/PanelSkeleton";

interface BlogFeedProps {
  rssUrl: string;
}

export function BlogFeed({ rssUrl }: BlogFeedProps) {
  const { data, loading } = useMissionBlog(rssUrl);

  if (loading && !data) return <PanelSkeleton lines={4} />;
  if (!data || data.length === 0) {
    return (
      <Panel title="Mission Log" icon={<Newspaper size={14} />} status="idle">
        <p className="text-text-muted text-xs font-mono">No updates available</p>
      </Panel>
    );
  }

  return (
    <Panel title="Mission Log" icon={<Newspaper size={14} />} status="nominal">
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {data.slice(0, 5).map((post) => (
          <a
            key={post.link}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-cyan mt-1.5 shrink-0" />
              <div>
                <time className="text-[9px] font-mono text-text-muted block">
                  {new Date(post.pubDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                <p className="text-xs text-text-primary group-hover:text-cyan transition-colors font-medium mt-0.5">
                  {post.title}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 line-clamp-2">
                  {post.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Panel>
  );
}
